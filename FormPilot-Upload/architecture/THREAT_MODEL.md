# THREAT_MODEL — Bedrohungsmodell FormPilot

Version 0.1 · Stand Juli 2026 · Status: Entwurf zur Freigabe
Methodik: STRIDE je Angriffsfläche + priorisierte Risikoliste. Bezieht sich auf die Zielarchitektur (ARCHITECTURE.md), nicht auf die Demo.

---

## 1. Schutzgüter (Assets)

| Asset | Wert |
|---|---|
| A1 Profildaten (Steuer-ID, IBAN, SV-Nr., Gesundheits-/Pflegedaten) | sehr hoch — bes. Kategorien Art. 9 DSGVO möglich (Pflegegrad) |
| A2 Dokumente (Ausweise, Bescheide, Vollmachten) | sehr hoch — Identitätsdiebstahl-Material |
| A3 Freigabe-Links + Snapshots | hoch — direkter Datenabfluss-Kanal |
| A4 Audit-/Zugriffsprotokoll | hoch — Integrität ist Vertrauensbasis |
| A5 Zugangsdaten/Sessions | hoch — Schlüssel zu A1–A3 |
| A6 Schlüsselmaterial (KEK/DEKs) | kritisch |
| A7 Marke/Vertrauen | hoch — Phishing-Missbrauch schadet ohne technischen Einbruch |

## 2. Akteure

| Akteur | Motivation | Fähigkeit |
|---|---|---|
| Opportunistische Angreifer (Credential Stuffing, Scanner) | Datenverkauf | niedrig–mittel |
| Gezielte Angreifer (Identitätsdiebstahl einzelner Personen) | Betrug | mittel |
| Böswilliger „Empfänger“ / gefälschte Organisation | Daten erschleichen | niedrig technisch, hoch sozial |
| Böswilliger Angehöriger (Mandats-Missbrauch) | Kontrolle über verwaltete Person | niedrig |
| Innentäter/Betreiber-Kompromittierung (Admin, Provider) | breit | hoch |
| Staatliche Zugriffe außerhalb EU-Rechtsrahmen | Datenzugriff | abhängig von Provider-Wahl (DATA_RESIDENCY.md) |

## 3. STRIDE je Angriffsfläche (Auszug der relevanten Zellen)

**F1 Login/Konto** — Spoofing: Credential Stuffing, Phishing → argon2id, Rate-Limits, 2FA, Passkeys, Gerätebenachrichtigung. Repudiation: Login-Historie im Audit.
**F2 Freigabe-Endpunkt (öffentlich)** — Information Disclosure: Token-Raten, Link-Weiterleitung an Dritte → 128-bit-Token nur als Hash, Rate-Limit, Ablaufpflicht, Passwortoption, Zugriffsprotokoll sichtbar. Tampering: Manipulation des Snapshots → Snapshot unveränderlich, Integrität via DB-Constraints.
**F3 Upload/Verarbeitung** — Tampering/EoP: Malware-Dateien, Zip-/PDF-Parser-Exploits → Allowlist, Magic Bytes, ClamAV, isolierter Worker ohne Egress, kein serverseitiges Rendern fremder Inhalte.
**F4 API/AuthZ** — EoP: IDOR über fremde `person_id`/`document_id` → zentrale Ownership-Prüfung + RLS als zweite Linie + Property-Tests je Route.
**F5 Frontend** — Information Disclosure/XSS → React-Escaping, strikte CSP, keine `dangerouslySetInnerHTML`-Ausnahmen ohne Review.
**F6 Betrieb/Infra** — EoP: SSH-Kompromittierung, Supply-Chain (npm) → Key-only SSH, minimale Angriffsfläche, Lockfiles, Dependency-Scanning, signierte Deploys. Repudiation: unveränderliche Audit-Events, getrennte Log-Senke.
**F7 Backups** — Information Disclosure: Backup-Abfluss → eigene Backup-Verschlüsselung, getrennter Schlüssel, Zugriff dokumentiert.
**F8 Anfrage-Eingang (später Org-Anfragen)** — Spoofing: gefälschte „Organisation bittet um Unterlagen“ → v1: Nutzer initiiert selbst (Text einfügen), UI markiert ungewöhnliche Posten; Org-Portal später nur mit Absender-Verifikation (Domain-Nachweis, Signatur).

## 4. Top-Risiken (priorisiert)

| # | Risiko | Eintritt | Schaden | Maßnahmen (v1) | Restrisiko |
|---|---|---|---|---|---|
| R-1 | Kontoübernahme (Stuffing/Phishing) → Vollzugriff auf A1–A3 | mittel | sehr hoch | 2FA, Rate-Limits, Breach-Passwortliste, Geräte-Mails, Step-up bei Freigaben | mittel — 2FA in v1 optional; Entscheidung: für Freigaben erzwingen? (offen) |
| R-2 | Freigabe-Link gelangt an Dritte (Weiterleitung, Mail-Kompromittierung des Empfängers) | mittel–hoch | hoch | Ablaufpflicht, kurze Standardfristen, Passwortoption, sichtbares Zugriffsprotokoll, Widerruf | mittel — inhärent beim Link-Teilen; Produkt kommuniziert es ehrlich |
| R-3 | Server-/Secret-Kompromittierung → Masse an Klartext trotz Verschlüsselung (KEK erreichbar) | niedrig | kritisch | Härtung, minimale Dienste, Secret-Store, Alarmierung, kein E2E-Anspruch kommuniziert | hoch im Worst Case — akzeptiert für v1, HSM/KMS + E2E-Tresor als Roadmap |
| R-4 | IDOR/AuthZ-Fehler einzelner Routen | mittel | hoch | zentrale Zugriffsschicht, RLS, Tests, Pen-Test vor Launch | niedrig–mittel |
| R-5 | Phishing MIT der Marke (gefälschte FormPilot-Mails/-Seiten) | mittel | hoch (Vertrauen) | SPF/DKIM/DMARC (p=reject), konsistente Domains, Produkt erklärt „FormPilot fragt nie nach…“ | mittel — nicht vollständig kontrollierbar |
| R-6 | Mandats-Missbrauch (Handeln für Angehörige ohne Grundlage) | niedrig–mittel | hoch (rechtlich) | Mandat mit Nachweis-Dokument, deutliche „Handelnd für X“-Kennzeichnung, Audit; keine Verifikationsbehauptung | mittel — v1 prüft nicht rechtlich; klar kommunizieren |
| R-7 | Malware-Upload kompromittiert Verarbeitung oder Empfänger | niedrig | hoch | AV-Scan, Isolation, keine Ausführung, Download-Warnhinweise | niedrig |
| R-8 | Datenverlust (Bedienfehler, Bug, Ransomware) | niedrig | hoch | PITR, versionierte Objekte, getestete Restores, Soft-Delete-Fenster | niedrig |
| R-9 | Rechtsverletzung durch falsche Sicherheitsaussagen | mittel (Marketing-Druck) | hoch (UWG/DSGVO, Vertrauen) | Freigabeliste SECURITY_MODEL §12, Review-Pflicht für Website-Texte | niedrig bei Disziplin |
| R-10 | Subprozessor-/Jurisdiktionsrisiko (US-Zugriff) | abhängig von Wahl | mittel–hoch | Provider-Wahl DE/EU (HOSTING_DECISION.md), Subprozessorliste, PSP-Daten minimieren | dokumentiert je Dienst |

## 5. Frühwarn- und Reaktionsfähigkeit (v1-Minimum)

- Alarmierung: fehlgeschlagene Logins über Schwellwert, Share-Token-Raten, AV-Funde, ungewöhnliche Exportvolumina → Mail/Push an Betreiber.
- Incident-Runbook: Schritte für „Konto kompromittiert“, „Token-Leak“, „Server kompromittiert“ (Sessions global invalidieren, KEK rotieren, Meldung nach Art. 33 DSGVO binnen 72 h prüfen), Kontaktkette, Kommunikationsvorlagen.
- Kill-Switches: Freigabe-Endpunkt global deaktivierbar; Registrierung schließbar.

## 6. Explizit akzeptierte Restrisiken (Freigabe durch Gründer nötig)

1. Kein E2E in v1 → Betreiber-/Serverkompromittierung bleibt kritisch (R-3).
2. 2FA optional (falls so entschieden) → R-1 erhöht.
3. Einzelregion-Betrieb → Verfügbarkeitsrisiko bei Provider-Ausfall.
4. Keine rechtliche Mandatsprüfung → R-6 verbleibt beim Nutzer, Produkt muss das unmissverständlich sagen.
