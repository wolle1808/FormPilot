# DATA_RESIDENCY — Datenresidenz und Subprozessoren

Version 0.1 · Stand Juli 2026 · Status: Entwurf zur Freigabe
Verbindliche Regel: **Keine Aussage zu deutscher Datenhaltung oder Sicherheit ohne Nachweis.** Dieses Dokument ist die eine Quelle dafür, was gesagt werden darf.

---

## 1. Datenkategorien und Ziel-Speicherorte (v1)

| Kategorie | Beispiele | Speicherort | Jurisdiktion |
|---|---|---|---|
| Inhaltsdaten | Profilwerte, Dokumente, Freigabe-Snapshots, Vorgänge | PostgreSQL + Object Storage, Hetzner **Deutschland** | DE |
| Konto-/Authdaten | E-Mail, Passwort-Hash, 2FA | PostgreSQL, Hetzner DE | DE |
| Audit-/Zugriffsprotokolle | audit_events, share_access_events (IP nur gehasht) | PostgreSQL, Hetzner DE | DE |
| Backups | DB-PITR, Objekt-Kopien (verschlüsselt) | Hetzner DE + Offsite-Kopie EU (Anbieter offen) | DE/EU |
| Transaktionale E-Mails | Reset-Links, Freigabe-Benachrichtigungen | EU-Versanddienst (z. B. Brevo, DE/FR) — enthält E-Mail-Adresse + Vorgangs-Metadaten, **nie Inhaltsdaten** | EU |
| Fehler-/Betriebsdaten | Stacktraces, Metriken (ohne Klartext-PII) | Sentry EU-Region oder self-hosted (DE) | DE/EU |
| Zahlungsdaten (später) | Name, E-Mail, Zahlungsmittel — liegt beim PSP, nie bei FormPilot | PSP-abhängig (MONETIZATION_ARCHITECTURE.md §6) | offen — bei Stripe: US-Konzern |

Gestaltungsregeln:
- Inhaltsdaten verlassen die DE-Infrastruktur nicht — auch nicht für Support, Analyse oder KI-Funktionen.
- E-Mails enthalten Links statt Inhalte („Es liegt eine Mitteilung für dich vor“), damit der Mail-Dienst keine sensiblen Daten sieht.
- Produkt-Analytik nur aggregiert/anonym und self-hosted (oder gar nicht); keine US-Analytics-SDKs.

## 2. Subprozessoren-Register (Ziel v1 — vor Launch zu vervollständigen)

| Dienst | Zweck | Sitz/Verarbeitung | Datenumfang | AVV | Status |
|---|---|---|---|---|---|
| Hetzner Online GmbH | Server, Objektspeicher, Backups | DE / Falkenstein+Nürnberg | alle Inhaltsdaten (teils nur Ciphertext) | ✔ Standard-AVV | vorgesehen |
| Offsite-Backup (z. B. IONOS SE) | Zweitkopie Backups (verschlüsselt) | DE | Ciphertext | ✔ | zu entscheiden |
| E-Mail-Versand (z. B. Brevo GmbH) | Transaktionsmails | DE/FR | E-Mail-Adresse, Betreff-Metadaten | ✔ | zu entscheiden |
| Monitoring (GlitchTip self-hosted ODER Sentry EU) | Fehlerdiagnose | DE bzw. EU | technische Daten, PII-gefiltert | ✔/entfällt | zu entscheiden |
| PSP (später: Mollie B.V. oder Stripe) | Zahlungen | NL bzw. US-Konzern/IE | Zahlungs-Stammdaten | ✔ | offen (ADR-6) |
| Registrar/DNS (EU) | Domain | EU | keine Nutzerdaten | — | zu entscheiden |

Pflege: Jede Änderung an dieser Tabelle vor Aktivierung; öffentlich einsehbare Subprozessorliste ab Launch (Website), Ankündigungsfrist bei Wechseln.

## 3. Jurisdiktions-Bewertung (ehrlich)

1. **DE-Provider (Hetzner/IONOS/StackIT):** Inhaltsdaten unterliegen deutschem/EU-Recht; kein US-CLOUD-Act-Durchgriff über den Provider. Das ist die Grundlage der Residenz-Aussage — nicht mehr: Es schützt nicht gegen Angriffe, Betreiberfehler oder rechtmäßige deutsche Anordnungen.
2. **US-Hyperscaler-EU-Region:** wäre „Speicherort DE“, aber kein belastbares „kein US-Zugriff“. Deshalb für Inhaltsdaten ausgeschlossen (HOSTING_DECISION.md).
3. **Rest-US-Kontakt:** Bei PSP-Wahl Stripe bestünde US-Bezug für Zahlungs-Stammdaten. Wer die Aussage „vollständig ohne US-Dienste“ will, muss Mollie (NL) o. ä. wählen — bewusste, offene Entscheidung (ADR-6). Zahlungsdaten sind von Inhaltsdaten getrennt; die Residenz-Aussage ist entsprechend zu formulieren.

## 4. Zulässige Aussagen — mit erforderlichem Nachweis

| Aussage (erlaubte Formulierung) | Voraussetzung / Nachweis (im Ordner `architecture/evidence/` abzulegen) |
|---|---|
| „Deine Daten werden auf Servern in Deutschland gespeichert.“ | Live-Setup bei Hetzner DE; Terraform-State/Provider-Rechnung; Subprozessorliste ohne Nicht-DE-Inhaltsverarbeiter |
| „Unser Rechenzentrumsbetreiber ist ISO-27001-zertifiziert.“ | aktuelles Provider-Zertifikat; korrekt dem Provider zugeschrieben, nicht FormPilot |
| „Dokumente werden verschlüsselt gespeichert (AES-256).“ | Implementierung + Code-Review-Protokoll (SECURITY_MODEL.md §5, §12) |
| „Übertragung verschlüsselt (TLS).“ | SSL-Labs-Report Grade A |
| „Wir setzen ausschließlich europäische Dienstleister für deine Inhaltsdaten ein.“ | vollständiges Subprozessor-Register §2 |
| „Jeder Zugriff auf Freigaben wird protokolliert.“ | Feature live + Testprotokoll |

**Nicht zulässig** (auch nicht sinngemäß): „DSGVO-zertifiziert“ (existiert so nicht), „bankensicher“, „100 % sicher“, „BSI-geprüft“ (ohne Testat), „Ende-zu-Ende-verschlüsselt“ (Architektur gibt das in v1 nicht her), „auch wir können deine Daten nicht lesen“.

## 5. DSGVO-Betriebspflichten (produktnah)

- Verzeichnis von Verarbeitungstätigkeiten, TOM-Dokument, Löschkonzept: vor Beta-Launch mit echten Daten.
- Datenschutzerklärung, die die Tabelle aus §1 in Alltagssprache spiegelt (Brand-Ton: „Datenschutz als UI“).
- DSFA (Datenschutz-Folgenabschätzung): erforderlich prüfen — Pflegedaten (Art.-9-Nähe) + systematische Verwaltung von Ausweisdokumenten sprechen dafür; vor Launch mit externer Beratung klären.
- Betroffenenrechte im Produkt: Export (ZIP mit JSON+Dateien), Löschung mit 30-Tage-Fenster, Auskunft = Export.
- Meldeprozess Art. 33 (72 h) im Incident-Runbook (THREAT_MODEL.md §5).
- AV-Verträge mit allen Subprozessoren vor deren Aktivierung.

## 6. Residenz-Zusagen gegenüber Organisationen (später)

Für Org-Abos/Kommunen werden zusätzliche Nachweise erwartet (C5-Testat der Infrastruktur, ggf. eigenes ISO 27001). Vorbereitung: Beweisordner ab Tag 1 pflegen; Infrastrukturwahl (HOSTING_DECISION.md Eskalationspfad) hält den Weg zu C5-fähigen Providern offen. Keine Zusage in Verträgen, die §4 widerspricht.
