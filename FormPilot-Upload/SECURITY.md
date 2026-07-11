# SECURITY — Sicherheitsmaßnahmen FormPilot

Version 0.2 · Stand Juli 2026
Ergänzt das ausführliche `architecture/SECURITY_MODEL.md` und `architecture/THREAT_MODEL.md`. Dieses Dokument beschreibt **konkret Umgesetztes** in der Beta (`app/index.html`) und den Plan für die Server-Version. Grundsatz: Es wird nur behauptet, was umgesetzt und belegbar ist.

---

## 1. Was in der Beta umgesetzt ist (`app/index.html`)

### Eingabevalidierung
- Formatprüfung mit klaren, freundlichen Meldungen: E-Mail, Telefonnummer, IBAN (Länge + **mod-97-Prüfziffer**), Steuer-ID (11 Ziffern + **ISO-7064-Prüfziffer**), Sozialversicherungsnummer (Format + **Prüfziffer**), Datum (TT.MM.JJJJ, Existenzprüfung), Postleitzahl (5 Ziffern), BIC.
- Validierung an allen Eingabestellen: Profilfelder, eigene Felder, Vorgangs-/Freigabe-Assistenten, Onboarding.

### Output-Escaping & XSS-Schutz
- Zentrale `esc()`-Funktion escaped `& < > "` und wird auf **jeden** nutzergelieferten Wert angewandt, der in `innerHTML` landet (Namen, Zwecke, Notizen, Werte, Dokumentnamen, Protokolltexte).
- **Escape beim Rendern**, nicht beim Speichern — Log-/Mitteilungs-/Verlaufstexte werden konsequent über `esc()` ausgegeben.
- Toasts nutzen `textContent` (kein HTML-Parsing).
- **Keine Inline-Event-Handler.** Interaktion ausschließlich über zentrale Event-Delegation (`data-act`), dadurch keine `on*=`-Attribute im HTML.
- Kein `eval`, kein `new Function`, kein `document.write`.

### Sichere DOM-Nutzung
- Objekt-URLs für Vorschauen werden nach Gebrauch mit `URL.revokeObjectURL` freigegeben.
- Freigabe-Token bestehen nur aus `[a-z0-9]`, keine sensiblen Daten im Token, in der URL oder im Seitentitel (Empfängeransicht setzt einen generischen Titel).

### Datei-Upload
- **Typprüfung doppelt:** Endung **und** Magic-Bytes (PDF `%PDF`, JPG `FFD8FF`, PNG `89504E47`, HEIC `ftyp`). Passt der Inhalt nicht zum Typ → Ablehnung („beschädigt“).
- **Nur erlaubte Typen:** PDF, JPG, PNG, HEIC. **Keine ausführbaren Dateien** (.exe, .js, Office-Makros etc.) — alles andere wird abgelehnt.
- **Größenlimit** 10 MB je Datei; leere Dateien werden abgelehnt.
- Dateien liegen als Blobs in IndexedDB, getrennt von den Metadaten im State.

### Fehlerbehandlung
- **Sichere Fehlertexte:** durchweg generische, verständliche Meldungen („Die Datei konnte nicht gelesen werden — bitte erneut versuchen.“).
- **Keine Stack Traces / keine `error.message`** in der Nutzeransicht; interne Fehler werden abgefangen und neutral gemeldet.

### HTTP-/Browser-Härtung
Per `<meta>` (Fallback, in jeder Hosting-Umgebung wirksam) **und** per HTTP-Header (`netlify.toml`, autoritativ):

| Maßnahme | Ort | Wert |
|---|---|---|
| Content Security Policy | meta + Header | `default-src 'none'` + eng gefasste Quellen; `frame-ancestors 'none'` nur im Header |
| Referrer-Policy | meta + Header | `no-referrer` |
| Permissions-Policy | Header | nur `camera=(self)`, alles andere aus; `browsing-topics=()`, `interest-cohort=()` |
| X-Content-Type-Options | Header | `nosniff` |
| Frame-Schutz | meta CSP + Header | `X-Frame-Options: DENY` + `frame-ancestors 'none'` |
| HSTS (HTTPS-Vorbereitung) | Header | `max-age=63072000; includeSubDomains; preload` |
| Cross-Origin-Opener/Resource-Policy | Header | `same-origin` |
| Kein sensibles Caching | Header | `Cache-Control: no-store` auf dem HTML-Dokument |
| noindex | meta | `noindex, nofollow` (gesamte App, inkl. Empfängeransicht) |

**CSP-Hinweis:** Die Beta ist eine einzelne Datei mit Inline-Skript/-Styles; die CSP erlaubt daher `'unsafe-inline'` für `script-src`/`style-src`. Da es keine Inline-Event-Handler gibt und der einzige `<script>`-Block aus dem eigenen Bundle stammt, bleibt die Angriffsfläche klein. Die Server-Version (`webapp/`) liefert Skripte extern mit **Nonce** aus und entfernt `'unsafe-inline'`.

**Kein Drittanbieter-Request:** Die externe Schriftart (Google Fonts) wurde entfernt; die App nutzt den System-Font-Stack. Damit gibt es außer dem optionalen Feedback-Versand (Netlify Forms) **keine** ausgehende Verbindung — datenschutzfreundlich und CSP-strikt.

### HTTPS
- Netlify stellt TLS automatisch bereit; „Force HTTPS“ im Dashboard aktivieren. HSTS signalisiert Browsern die dauerhafte HTTPS-Nutzung. (Dokumentiert in `netlify.toml`.)

### Secrets
- **Keine Secrets im Repository.** Die Beta braucht keine. `.env`, `.env.local`, `.env.*.local` sind in `.gitignore`; committet sind nur Platzhalter-Beispieldateien (`.env.example`, `webapp/.env.example`). Scan bestätigt: keine echten Keys/Tokens im Repo.

---

## 2. Freigabetoken (Beta → Server)

**Beta:** Zufälliger Token (`[a-z0-9]`, ~22 Zeichen) je Freigabe; enthält keine personenbezogenen Daten. Der Link öffnet die Empfängeransicht lokal (kein extern erreichbarer Endpunkt — ehrlich als Beta-Grenze gekennzeichnet).

**Server (geplant, siehe RLS_CONCEPT.md §4 / SUPABASE_SCHEMA.md):**
- Lange, kryptografisch zufällige Token; **nur gehasht** gespeichert (`SHA-256(token + pepper)`), Klartext nie in der DB.
- Ablaufdatum, Widerrufsstatus, optionales Passwort (gehasht), Zugriffszähler, Zugriffsprotokoll.
- **Serverseitige Prüfung** (`resolve_share`): widerrufen/abgelaufen → liefert nichts; Passwort-Fehlversuch wird protokolliert.
- Keine sensiblen Daten im Token; Download nur über kurzlebige signierte URLs bei `permission='download'`.

---

## 3. Server-Version — Kurzplan

- Auth: E-Mail/Passwort (argon2id), E-Mail-Bestätigung, Passwort-Reset, optional Magic Link; Passkeys/2FA später (siehe MIGRATION_PLAN.md, SECURITY_MODEL.md §2).
- Autorisierung: „deny by default“ + PostgreSQL-RLS (RLS_CONCEPT.md).
- Storage: privater Bucket, keine öffentlichen URLs, kurzlebige signierte URLs, Pfadtrennung je Nutzer/Person, Virenscan später.
- CSP ohne `'unsafe-inline'` (Nonces), Rate-Limiting, serverseitige Sessions mit Widerruf.

---

## 4. Verantwortliche Offenlegung

Sicherheitslücke gefunden? Bitte **nicht** öffentlich posten, sondern per E-Mail an **mauricewollmer@gmail.com** mit Beschreibung und Reproduktion. Wir bestätigen den Eingang und halten dich über die Behebung auf dem Laufenden.
