# SECURITY_MODEL — Sicherheitsmodell FormPilot

Version 0.1 · Stand Juli 2026 · Status: Entwurf zur Freigabe
Referenzrahmen: OWASP ASVS 4.0 Level 2 · Ergänzend: THREAT_MODEL.md, DATA_RESIDENCY.md

**Grundsatz:** Es wird nur behauptet, was umgesetzt und belegbar ist. Dieses Dokument unterscheidet ausdrücklich zwischen „in v1 umgesetzt“, „geplant“ und „bewusst nicht geleistet“.

---

## 1. Schutzziele und Prioritäten

| Priorität | Schutzziel | Warum |
|---|---|---|
| 1 | Vertraulichkeit der Nutzerdaten (Profile, Dokumente, Freigaben) | Kern des Produktversprechens „Dokumentensafe“ |
| 2 | Integrität von Freigaben und Audit-Protokoll | Übergaben müssen beweisbar korrekt sein |
| 3 | Nachvollziehbarkeit (wer, was, wann) | Vertrauen entsteht durch sichtbare Kontrolle |
| 4 | Verfügbarkeit | Wichtig, aber v1 akzeptiert Einzelregion (ARCHITECTURE.md NFR) |

## 2. Identität & Authentifizierung (v1)

- Passwörter: argon2id (memory-hard, Parameter dokumentiert), Mindestlänge 10, Prüfung gegen Kompromittierungs-Listen (lokale Bloom-Liste, kein externer API-Call mit Passwortmaterial).
- 2FA: TOTP ab Tag 1 optional, für sensible Aktionen als Step-up erzwingbar; Passkeys/WebAuthn in v1.x.
- Sessions: httpOnly-, Secure-, SameSite=Lax-Cookies; serverseitige Sessions mit Widerruf (Geräteliste); Inaktivitäts-Timeout 30 Tage, absolutes Timeout 90 Tage.
- Anmelde-Härtung: Rate-Limiting pro Konto+IP, konstante Antwortzeiten, keine Nutzer-Enumeration, Benachrichtigung bei neuem Gerät.
- Konto-Wiederherstellung: E-Mail-Reset mit kurzlebigem Einmal-Token; 2FA-Recovery-Codes. Kein Support-Override ohne dokumentierten Identitätsnachweis-Prozess.
- `assurance_level` bleibt in v1 `self_declared` — FormPilot behauptet keine geprüfte Identität (BundID/eID hebt das später).

## 3. Autorisierung

- Grundmodell: Alles gehört einem `owner_user_id`; Standard-Policy „deny by default“, zentral erzwungen (eine Zugriffsschicht, keine verstreuten Checks). Zusätzlich PostgreSQL-RLS als zweite Verteidigungslinie.
- Mandate: Zugriff auf verwaltete Personen nur über `mandates`-Eintrag; jede Aktion „für jemand anderen“ wird im Audit als solche gekennzeichnet (UI zeigt es an — Brand-Guideline).
- Empfängerzugriff: ausschließlich über Share-Token (128 bit Entropie, nur Hash in DB) + optional Passwort; kein Konto nötig; strikt auf `share_items`-Snapshot begrenzt.
- Step-up-Bestätigung: Freigabe erstellen, Freigabe widerrufen, Konto löschen, Export — immer explizite Bestätigung; bei aktivierter 2FA optional Re-Auth.

## 4. Transport & Perimeter

- TLS 1.2+ (bevorzugt 1.3) überall, HSTS inkl. Preload, moderne Cipher-Suites.
- Security-Header: CSP ohne `unsafe-inline` (Frontend-Neubau macht das möglich — die Demo erfüllt das nicht), X-Content-Type-Options, Referrer-Policy, Frame-Ancestors none.
- Rate-Limits pro Route-Klasse (Auth streng, Share-Zugriff mittel, API-Standard); Fail2ban/Firewall auf VM-Ebene; SSH nur mit Keys, kein Passwort-Login.

## 5. Verschlüsselung ruhender Daten (v1 — ehrliche Beschreibung)

Hierarchie (Envelope-Verschlüsselung, softwarebasiert):

```
Master Key (KEK) — außerhalb der DB, im Secret-Store des App-Servers
   └── verschlüsselt Data Encryption Keys (DEK), rotierbar
         ├── DEK pro Datei (files.enc_key_id): AES-256-GCM je Objekt
         └── DEK pro Nutzer für sensible Feldwerte (value_enc, secret_enc)
```

- Dokumente werden vor dem Schreiben in den Objektspeicher anwendungsseitig mit AES-256-GCM verschlüsselt; der Objektspeicher sieht nur Ciphertext.
- Sensible Profilfelder (`field_definitions.sensitive`) und Freigabe-Snapshots werden spaltenweise verschlüsselt; nicht-sensible Felder liegen im Klartext in der DB (Suche/Sortierung), Datenträger sind zusätzlich verschlüsselt (Volume-Encryption).
- Schlüsselrotation: KEK-Rotation umschlüsselt nur DEKs (nicht die Objekte); Verfahren dokumentiert und getestet.
- **Grenze (ausdrücklich):** Der Anwendungsserver kann entschlüsseln — ein Angreifer mit Vollzugriff auf App-Server *und* Secret-Store kann Daten lesen. Das ist serverseitige Verschlüsselung, **keine** Ende-zu-Ende-Verschlüsselung. Marketing-Formulierung entsprechend: „verschlüsselt gespeichert“ erst ab Umsetzung + Nachweis, niemals „nur du kannst technisch lesen“.

## 6. Warum kein E2E in v1 (und der Weg dahin)

E2E (clientseitige Schlüssel) kollidiert mit v1-Funktionen: serverseitige Anforderungsanalyse, Ablauf-Erinnerungen auf Feldebene, Empfänger-Ansicht ohne Nutzergerät, Wiederherstellung bei Passwortverlust. Entscheidung: v1 serverseitig (§5), aber E2E-fähig vorbereitet — Dateien sind bereits einzeln verschlüsselte Objekte mit eigener DEK; ein späterer „Privater Tresor“ (Client-verschlüsselte Ablage ohne Serverfunktionen) kann DEKs clientseitig ableiten, ohne das Speichermodell zu ändern.

## 7. Uploads & Dokumentverarbeitung

- Allowlist (PDF, JPG, PNG), Größenlimit, Magic-Byte-Prüfung, Bildneucodierung optional.
- Virenscan (ClamAV als Job) vor Freigabe-Fähigkeit; `av_scan_status` muss `clean` sein, sonst nicht teilbar.
- PDF-Verarbeitung (spätere Extraktion) in isoliertem Worker ohne Netz-Egress; keine Ausführung eingebetteter Inhalte.
- Auslieferung: nur über kurzlebige, signierte URLs bzw. Streaming durch den App-Server mit AuthZ-Prüfung; `Content-Disposition` gesetzt, kein Inline-HTML-Rendering fremder Inhalte.

## 8. Freigabe-Sicherheit (Kernfläche)

- Token: ≥128 bit, URL-safe, einmalig, nur gehasht gespeichert; Brute-Force auf Share-Endpunkt streng rate-limitiert.
- Ablauf verpflichtend (kein unbefristetes Teilen — Produktregel), Widerruf sofort wirksam (Server-seitige Prüfung je Zugriff).
- Passwortoption: getrennt vom Link kommuniziert (Produkt-Text weist darauf hin), argon2id-gehasht, Fehlversuche limitiert + protokolliert.
- Snapshot-Prinzip (DATA_MODEL.md §7) verhindert nachträgliche stille Änderung geteilter Inhalte.
- Jeder Zugriff erzeugt `share_access_events` — sichtbar für den Nutzer in Alltagssprache.

## 9. Audit & Betrieb

- `audit_events` append-only (kein UPDATE/DELETE-Grant für App-Rolle); Uhrzeit vom Server, monotone IDs.
- Logs ohne sensible Klartexte; IPs nur gehasht (Peppered Hash) für Missbrauchserkennung.
- Backups: automatisiert, verschlüsselt (Backup-eigener Schlüssel), regelmäßige Restore-Tests (mindestens quartalsweise, dokumentiert).
- Secrets: sops/age-verwaltet im IaC-Repo, Laufzeit-Injektion; keine Secrets in Images oder Logs.
- Patching: unattended-upgrades + monatlicher Wartungstermin; Dependency-Scanning in CI (npm audit/OSV, Renovate).

## 10. Sicherer Entwicklungsprozess

- CI-Pflichten: Typprüfung, Lint, Tests, Dependency-Audit, Secret-Scan.
- Kein String-konkatenierter HTML-Code im neuen Frontend (React escaped per Default) — die bekannte XSS-Anfälligkeitsklasse der Demo entfällt konstruktiv.
- Parametrisierte Queries ausschließlich (ORM/Query-Builder).
- Vor öffentlichem Launch: externer Penetrationstest der Kern-Flows (Auth, Shares, Upload); Befunde und Fixes dokumentiert.
- security.txt + Responsible-Disclosure-Adresse ab Beta.

## 11. Was v1 bewusst NICHT leistet (transparent)

| Nicht geleistet | Konsequenz / Kommunikation |
|---|---|
| Ende-zu-Ende-Verschlüsselung | niemals suggerieren; Formulierung „verschlüsselt gespeichert, Zugriff nur nach deiner Freigabe“ erst nach Umsetzung §5 |
| HSM/Cloud-KMS | Schlüssel softwareverwaltet; Risiko dokumentiert (THREAT_MODEL R-3) |
| ISO-27001-/BSI-C5-Zertifizierung von FormPilot selbst | nur RZ-Zertifikate des Providers benennen, korrekt zugeschrieben (DATA_RESIDENCY.md) |
| Geprüfte Identität der Nutzer | „self_declared“; keine Aussage wie „verifizierte Personen“ |
| Verifizierte Organisationen | Empfänger sind in v1 vom Nutzer benannte Stellen; Org-Verifikation kommt mit Org-Portal |

## 12. Zulässige Sicherheitsaussagen (Freigabeliste für Marketing/Produkttexte)

Erst nach Umsetzung + internem Nachweis (Test/Screenshot/Config im Audit-Ordner) dürfen verwendet werden:
1. „Übertragung TLS-verschlüsselt“ — nach SSL-Labs-A-Rating.
2. „Dokumente verschlüsselt gespeichert (AES-256)“ — nach Implementierung §5 + Code-Review.
3. „Serverstandort Deutschland“ — nach Provider-Setup gem. HOSTING_DECISION.md + Subprozessorliste.
4. „Jeder Zugriff protokolliert“ — nach Implementierung §8/§9.
5. „Zwei-Faktor-Anmeldung verfügbar“ — nach TOTP-Launch.
Nicht zulässig (dauerhaft ohne entsprechende Zertifizierung/Architektur): „bankensicher“, „DSGVO-zertifiziert“, „100 % sicher“, „nur du kannst deine Daten lesen“.
