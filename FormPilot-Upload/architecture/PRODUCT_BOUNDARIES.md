# PRODUCT_BOUNDARIES — Was FormPilot ist und was nicht

Version 0.1 · Stand Juli 2026 · Status: Entwurf zur Freigabe
Gilt für: Produkt- und Architekturentscheidungen ab MVP. Bei Konflikt schlägt dieses Dokument Feature-Wünsche.

---

## 1. Positionierung in einem Satz

**FormPilot ist die Übergabeschicht zwischen Menschen und Organisationen:** Es verwahrt persönliche Daten und Nachweise auf Seite des Menschen und übergibt sie kontrolliert, nachvollziehbar und widerrufbar an die Systeme der Organisationen — es ersetzt diese Systeme nicht.

```
Mensch ──► FormPilot (Übergabeschicht) ──► Personio / DATEV / SAP / Fachverfahren / …
           │ Profil · Safe · Vorgänge    │  dort: Verarbeitung, Lohn, Akte, Bescheid
           │ Pakete · Freigaben          │
           └── Kontrolle bleibt hier ────┘
```

Konsequenz: FormPilot endet dort, wo die Verarbeitung in der Organisation beginnt. Alles hinter der Übergabe (Lohnlauf, Personalakte, Bescheiderstellung, Fallbearbeitung) ist bewusst **außerhalb** des Produkts.

## 2. Systemgrenzen gegenüber Nachbarsystemen

| System | Was es tut | Verhältnis zu FormPilot | Was FormPilot NIE übernimmt |
|---|---|---|---|
| Personio & andere HR-Systeme | Personalakte, Recruiting, Abwesenheiten | FormPilot liefert Onboarding-Daten/Nachweise strukturiert **an** Personio (Stufe-3-Konnektor, später) | Personalaktenführung, HR-Workflows, Berechtigungen im HR-System |
| DATEV | Lohn, Buchhaltung, Steuerkanzlei-Prozesse | FormPilot übergibt lohnrelevante Angaben (Steuer-ID, SV-Nr., IBAN …) als geprüftes Paket; Format-/API-Übergabe später | Lohnabrechnung, Meldeverfahren (ELStAM, DEÜV), Kanzleisoftware-Funktionen |
| SAP (HCM/SuccessFactors u. a.) | Enterprise-HR/ERP | Wie Personio: Zulieferung über Export/API, nie Direktzugriff auf SAP-Interna | ERP-Prozesse, Stammdatenhoheit der Organisation |
| Kommunale Fachverfahren | Antragsbearbeitung, Bescheide | FormPilot bereitet Anträge bürgerseitig vor und übergibt über definierte Kanäle (perspektivisch FIM/XÖV-konform) | Fachlogik, Bescheidung, Register, hoheitliche Akten |
| BundID / eID / eIDAS | Staatliche Identifizierung | Später als **Identitäts-Zulieferer** angebunden (Vertrauensniveau für Freigaben); FormPilot ist selbst kein Identitätsanbieter | Ausstellung von Identitäten, hoheitliche Authentifizierung |
| Cloud-Speicher (Dropbox, iCloud) | Generische Dateiablage | Kein Wettbewerb über Speicherplatz; FormPilot-Mehrwert = Struktur, Kontext, Freigabekontrolle | Generisches File-Sync, Kollaboration an Dateien |

**Hoheitsprinzip:** Die Organisation bleibt Herrin ihrer Systeme und Prozesse; der Mensch bleibt Herr seiner Daten. FormPilot besitzt keine der beiden Seiten — es ist der kontrollierte Übergabepunkt mit Protokoll.

## 3. Produktiver Scope v1 (Privatnutzer-App)

Im ersten produktiven Release enthalten:

1. **Sichere Profile** — Stammdaten pro Person im Haushalt, inkl. verwalteter Personen (Angehörige) mit dokumentierter Vollmachts-Grundlage.
2. **Dokumentensafe** — echte Datei-Uploads, Versionen, Gültigkeiten, Kategorien.
3. **Vorgänge** — Anforderungen erfassen (Text einfügen), Checkliste Vorhanden/Fehlt, Frist, Verlauf.
4. **Pakete** — wiederverwendbare Zusammenstellungen aus Dokumenten und Angaben.
5. **Freigaben** — 3-Schritte-Prozess, Empfängerlink mit Ablauf, Passwortoption, Widerruf, Zugriffsprotokoll.

Dazu produktiv nötig (nicht verhandelbar): Konto/Login mit 2FA, Datenexport, Konto-Löschung, Audit-Protokoll, Datenschutz-Grundausstattung (AVV-Kette, TOMs, Verzeichnis von Verarbeitungstätigkeiten).

## 4. Nur architektonisch vorbereitet (kein v1-Feature)

| Bereich | Vorbereitung in v1 | Bewusst NICHT in v1 |
|---|---|---|
| Organisationsportal | Datenmodell (`organizations`, `org_requests`), Empfänger als eigene Entität statt Freitext | UI für Organisationen, Org-Konten, Team-Verwaltung |
| Strukturierte Org-Anfragen | Anfrage-Schema (Posten-Katalog) ist bereits internes Format | Signierte/verifizierte Absender, Anfrage-Inbox von Orgs |
| Integrationen (Personio, DATEV, SAP) | Export-Schema (JSON) stabil versioniert; Event-Log als Webhook-Quelle | Live-Konnektoren, Marketplace-Zertifizierungen |
| Kommunal / FIM / XÖV | Feld-Katalog mit Mapping-Spalte für FIM-Datenfelder | Fachverfahrens-Anbindung, OZG-Prozesse |
| BundID / eID | `identity_assurance`-Feld an Nutzer/Freigaben (Vertrauensniveau) | eID-Flows, eIDAS-Zertifizierung |
| API für Dritte | interne API sauber geschnitten (API-first), `api_clients`-Tabelle | öffentliche API, Developer-Portal |

Details: INTEGRATION_ARCHITECTURE.md und DATA_MODEL.md.

## 5. Nicht-Ziele (dauerhaft)

- Kein soziales Netzwerk, kein Messenger, keine Werbeplattform.
- Keine Datenmonetarisierung: Nutzerdaten werden nie verkauft, nie für Werbung ausgewertet, nie für Training fremder Modelle bereitgestellt.
- Kein Ersatz für Rechtsberatung, Steuerberatung oder Behördenentscheidungen.
- Kein generisches DMS für Organisationen (die Org-Seite sieht nur, was freigegeben wurde).
- Keine „Alles-automatisch“-Versprechen: Jede Übergabe braucht die aktive Bestätigung des Menschen (Brand-Guideline, UX-Prinzip 9).

## 6. Leitplanken für Kommunikation

- Aussagen zu Sicherheit, Verschlüsselung, deutscher Datenhaltung nur, wenn technisch umgesetzt **und** belegbar (siehe DATA_RESIDENCY.md, Abschnitt „Zulässige Aussagen“).
- Simulierte oder geplante Funktionen werden als solche gekennzeichnet — im Produkt wie im Marketing.
- KI ist Funktion, nicht Botschaft (Brand-Guideline, verbindlich).

## 7. Entscheidungsregel für neue Feature-Ideen

Eine Idee kommt nur in den Scope, wenn alle drei Fragen mit Ja beantwortet werden:
1. Stärkt sie die Übergabeschicht (Verwahren, Vorbereiten, Übergeben, Kontrollieren)?
2. Bleibt die Systemhoheit der Organisation und die Datenhoheit des Menschen unangetastet?
3. Ist sie ohne unbelegbare Sicherheits- oder Compliance-Behauptung vermarktbar?
