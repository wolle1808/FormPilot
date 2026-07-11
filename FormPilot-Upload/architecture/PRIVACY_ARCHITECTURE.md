# PRIVACY_ARCHITECTURE — Datenschutz-Architektur

Version 0.1 · Stand Juli 2026 · Status: Entwurf
Bezug: SECURITY.md, RLS_CONCEPT.md, DATA_RESIDENCY.md, SUPABASE_SCHEMA.md

**Leitgedanke:** FormPilot verwaltet besonders schützenswerte Unterlagen. Datenschutz ist deshalb kein Zusatz, sondern Teil der Architektur — Datensparsamkeit, Zweckbindung, Nachvollziehbarkeit und die volle Kontrolle der betroffenen Person.

---

## 1. Verbindliche Zusagen (in der App sichtbar)

Diese Zusagen stehen auf der Datenschutzseite der App und gelten als Produktversprechen:

1. **Keine Nutzung persönlicher Dokumente für Modelltraining.** Profildaten und Dokumente werden niemals zum Training von KI-Modellen verwendet.
2. **Keine Werbung, kein Datenverkauf.** Keine Werbeanzeigen, keine Weitergabe zu Werbezwecken.
3. **Keine Weitergabe ohne Zustimmung.** Daten verlassen das Konto nur über eine vom Nutzer selbst erstellte Freigabe.
4. **Keine Tracking-Cookies im App-Bereich.** Kein Analytics, keine Werbe-/Tracking-Cookies. Gespeichert wird nur, was die App zum Funktionieren braucht.

---

## 2. Datenflüsse

### Beta (`app/index.html`)
- **Speicherung ausschließlich lokal:** Strukturdaten in `localStorage` (Schlüssel `formpilot-core-v1`), Dateien als Blobs in `IndexedDB`. Kein Server, kein Konto.
- **Ausgehende Verbindungen:** genau eine, und nur auf ausdrückliche Aktion — der **Feedback-Versand** (Netlify Forms). Kein externer Font, kein Analytics, kein CDN.
- **Empfängeransicht:** in der Beta lokal (gleicher Browser); ehrlich als Beta-Grenze gekennzeichnet.

### Server-Version (geplant)
- Daten in Supabase (Postgres + Storage), Region EU (Details: `DATA_RESIDENCY.md`).
- Zugriff strikt über RLS; Dateien in privaten Buckets, nur über kurzlebige signierte URLs.
- Empfängeransicht über eine serverseitige, freigabe-geprüfte Funktion (`resolve_share`).

---

## 3. Einwilligungen (Consents)

- Modelliert mit **Fassung (Version) und Zeitpunkt**; erneute Zustimmung bei Versionssprung.
- Kategorien: `datenschutz` (erforderlich), `nutzung` (erforderlich), `produktinfos` (optional, standardmäßig aus).
- In der Beta im State (`consents[]`) und auf der Datenschutzseite einsehbar/änderbar; jede Änderung wird als `konto`-Ereignis protokolliert.
- Server: Tabelle `consents` als Append-Log (jede Zustimmung/Widerruf eine Zeile) für lückenlosen Nachweis (siehe SUPABASE_SCHEMA.md §1).

---

## 4. Betroffenenrechte (DSGVO) — Umsetzung

| Recht | Umsetzung Beta | Umsetzung Server (geplant) |
|---|---|---|
| Auskunft / Datenübertragbarkeit (Art. 15/20) | **Datenexport**: lesbarer Überblick (.txt) + vollständige Sicherung (.json); Dokumente einzeln herunterladbar | Export-Job erzeugt beides serverseitig, inkl. Dateien |
| Berichtigung (Art. 16) | jederzeit editierbar, mit Quelle/Änderungsdatum | dito, mit Audit |
| Löschung (Art. 17) | **Konto löschen**: aktive Freigaben werden zuerst widerrufen, dann werden alle lokalen Daten (localStorage + IndexedDB) entfernt | serverseitiger Lösch-Job: Freigaben widerrufen, Zeilen + Storage-Objekte entfernen, Audit-Eintrag |
| Einschränkung (Art. 18) | Archivieren von Person/Dokument/Vorgang | dito |
| Widerspruch (Art. 21) | Einwilligungen widerrufbar; keine Werbeprofile | dito |

**Löschreihenfolge (wichtig):** Beim Löschen werden **immer zuerst aktive Freigaben widerrufen** (Links deaktiviert), damit nach der Löschung niemand mehr Zugriff hat — dann erst die Daten entfernt. In der Beta über `FP._wipe('delete')` umgesetzt und getestet.

---

## 5. Datensparsamkeit & Zweckbindung

- **Feldkatalog statt Freitext-Sammelwut:** definierte Felder, jedes optional/erforderlich gekennzeichnet; **kein Zwang zur vollständigen Profilerfassung**.
- **Keine Gesundheitsdetails:** ausdrücklich keine Diagnosen, Allergien, Medikamente oder Behandlungsdaten (nur Pflege-Verwaltungsdaten wie Pflegegrad/Aktenzeichen).
- **Freigabe-Snapshots:** eine Freigabe teilt nur die ausgewählten Positionen, eingefroren zum Freigabezeitpunkt — keine stille Ausweitung, keine Live-Sicht ins Profil.
- **Plausibilitätshinweis „für diesen Zweck ungewöhnlich“:** unterstützt Datensparsamkeit gegenüber dem Empfänger, ohne Rechtsbewertung.
- **Sensible Werte maskiert:** IBAN, Steuer-ID, SVNR etc. werden maskiert angezeigt und erst auf Klick sichtbar.

---

## 6. Protokollierung (Transparenz)

Verständliches Aktivitätsprotokoll (in der App unter „Sicherheit“) mit klassifizierten Ereignissen: Anmeldung, Profiländerung, Dokumentupload, neue Dokumentversion, Dokumentlöschung, Vorgang erstellt, Freigabe erstellt, Freigabe geöffnet, Download, Widerruf, Ablauf, Export, Kontoänderung. Zusätzlich pro Freigabe ein eigenes Zugriffsprotokoll. Server: `audit_events` + `share_accesses`, append-only (RLS_CONCEPT.md §5).

---

## 7. Auftragsverarbeitung & Subunternehmer (Server, geplant)

- **Netlify** (Hosting statischer Beta + Formulare), **Supabase** (DB/Auth/Storage, EU-Region), optional **Resend** (E-Mail), **Stripe** (Zahlung) — jeweils mit AV-Vertrag, dokumentiert im späteren Verzeichnis von Verarbeitungstätigkeiten. Keine Nutzung von Nutzerinhalten für deren eigene Zwecke.
- IP-Adressen in Protokollen werden **gehasht** gespeichert, nicht im Klartext.
