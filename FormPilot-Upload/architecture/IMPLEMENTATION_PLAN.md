# IMPLEMENTATION_PLAN — Umsetzungsplan MVP

Version 0.1 · Stand Juli 2026 · Status: Entwurf zur Freigabe
Annahmen: 1 Entwickler (Maurice) mit KI-Unterstützung, ~15–25 Wochenstunden Produktzeit; Zeitangaben sind Kalender-Spannen, keine Zusagen. Scope-Referenz: PRODUCT_BOUNDARIES.md §3.

---

## 1. Phasenübersicht

| Phase | Inhalt | Ergebnis (auslieferbar) | Spanne |
|---|---|---|---|
| 0 | Fundament: Repo, CI, Infra, Auth-Skelett | Staging-Umgebung mit Login/2FA, leerer App-Shell | 3–4 Wo |
| 1 | Profile & Dokumentensafe (echte Uploads) | Nutzbarer privater Safe (Closed Alpha, eigene Nutzung) | 4–6 Wo |
| 2 | Freigaben (Kern der Übergabeschicht) | Erste echte Übergabe an einen Empfänger, Widerruf, Protokoll | 4–5 Wo |
| 3 | Vorgänge & Pakete + Import-Assistent | Feature-Parität mit Demo, aber echt · Private Beta (10–30 geladene Nutzer) | 4–6 Wo |
| 4 | Härtung & Compliance | Pen-Test bestanden, DSGVO-Ausstattung, Restore-Drill, Aussagen-Nachweise | 3–4 Wo |
| 5 | Public Beta + Freemium-Fundament | Offene Registrierung; Entitlement-Gates aktiv (noch ohne Bezahlung) | 2–3 Wo |
| 6+ | Monetarisierung M1, dann Org-Vorbereitung | PSP live; Org-Portal-Discovery | nach Traktion |

Reihenfolge-Prinzip: Sicherheitstragendes zuerst (Auth, Krypto, Audit sind Phase 0–2, nicht „später“). Jede Phase endet mit etwas real Benutzbarem.

## 2. Phase 0 im Detail (die erste konkrete Phase)

**Ziel:** Ein leeres, aber produktionswürdiges System: Ein Nutzer kann sich registrieren, per TOTP anmelden, sieht eine leere App — und alles darunter ist bereits richtig (Infra, Backups, Audit, CI).

### Arbeitspakete

**AP 0.1 — Repo & Werkzeuge (2–3 Tage)**
Monorepo (`backend/`, `frontend/`, `infra/`, `docs/` = diese Dokumente). TypeScript strict, Lint/Format, Commit-Hooks. CI (GitHub Actions o. ä.): Typecheck, Tests, Dependency-Audit, Secret-Scan, Build.

**AP 0.2 — Infrastruktur als Code (4–6 Tage)**
Terraform: 2 Hetzner-VMs (app/db), privates Netz, Firewall, Object-Storage-Bucket. Ansible: OS-Härtung (SSH-Keys only, unattended-upgrades, fail2ban), Docker, Caddy/Traefik mit TLS. Staging = verkleinerte Kopie von Prod, gleiche Skripte. **Abnahme: kompletter Neuaufbau aus dem Repo in < 1 Tag, dokumentiert.**

**AP 0.3 — Backend-Skelett (4–5 Tage)**
Fastify-App mit Modul-Layout (ARCHITECTURE.md §4), OpenAPI-Generierung, zentrale Fehlerbehandlung, Request-Validierung (Zod), Health-Endpoints. PostgreSQL-Anbindung + Migrations-Setup (MIGRATION_PLAN.md §6). `audit_events`-Tabelle + Audit-Helper ab dem ersten Feature.

**AP 0.4 — Identity-Modul (6–8 Tage)**
Registrierung mit E-Mail-Verifizierung, Login (argon2id), Server-Sessions mit httpOnly-Cookies, TOTP-Einrichtung + Recovery-Codes, Geräte-/Sessionliste mit Widerruf, Passwort-Reset, Rate-Limits, Konto-Löschung (Antrag + 30-Tage-Fenster). E-Mail-Versand über EU-Anbieter (nur Links, keine Inhalte — DATA_RESIDENCY §1).

**AP 0.5 — Frontend-Shell (4–5 Tage)**
React+Vite+TS, Design-Tokens und Texte aus der Demo übernommen (Brand-Guideline), Routing, Auth-Flows, leeres Dashboard mit ehrlichem Leerzustand. Strikte CSP von Anfang an. A11y-Grundgerüst (Fokus, Landmarken) von Tag 1.

**AP 0.6 — Betriebs-Minimum (2–3 Tage)**
Backups (pgBackRest → Object Storage, verschlüsselt) + erster Restore-Test. Fehler-Tracking (EU), Uptime-Check, Log-Rotation. Incident-Runbook v0 (THREAT_MODEL §5).

### Definition of Done Phase 0
- [ ] Staging + Prod per IaC reproduzierbar; Restore-Test protokolliert
- [ ] Registrierung→Login→2FA→Logout→Löschantrag end-to-end im Browser verifiziert
- [ ] Jede Auth-Aktion erzeugt Audit-Event; Events in UI-tauglicher Alltagssprache
- [ ] CI grün mit Audit/Secret-Scan; keine Secrets im Repo (sops/age)
- [ ] CSP ohne unsafe-inline, SSL-Labs A, Security-Header gesetzt
- [ ] Keine Marketing-Aussage geändert (Aussagen erst nach Nachweis — SECURITY_MODEL §12)

## 3. Phase 1–3 Kurzschnitt (Planungsrahmen)

- **Phase 1:** `persons`/`mandates`/Feldkatalog + Profil-UI (Demo-UX) · Datei-Upload mit Envelope-Verschlüsselung + AV-Scan · Dokumente/Versionen/Gültigkeiten · Datenexport (DSGVO). *Meilenstein: Ich verwalte meine echten Unterlagen selbst damit.*
- **Phase 2:** Shares mit Snapshot, Token-Link, Passwortoption, Ablauf, Widerruf · Empfänger-Ansicht (öffentliche Seite) · Zugriffsprotokoll · Step-up-Bestätigungen. *Meilenstein: Eine echte Übergabe an einen echten Empfänger.*
- **Phase 3:** Vorgänge (Anforderungstext → Checkliste, Katalog aus Demo) · Pakete · Import-Assistent aus Demo-Export · Benachrichtigungen (Fristen/Zugriffe). *Meilenstein: Private Beta mit 10–30 Nutzern, Feedback-Schleife wie bei der Demo.*

## 4. Querschnitts-Regeln für alle Phasen

1. Feature fertig = Migration + Tests + Audit-Events + A11y + deutscher Text im Brand-Ton + Doku-Absatz.
2. Entitlement-Gate an jeder kapazitätsrelevanten Aktion (No-op in v1) — MONETIZATION_ARCHITECTURE §2.
3. Vorbereitete Module bekommen nur Schema/Verträge, nie halbe UIs (PRODUCT_BOUNDARIES §4).
4. Wöchentlicher Deploy-Rhythmus ab Phase 1; kein Branch lebt länger als eine Woche.

## 5. Risiken des Plans

| Risiko | Frühindikator | Gegenmaßnahme |
|---|---|---|
| Phase 0 wird zur Infrastruktur-Bastelei | > 4 Wochen ohne Login-Demo | Scope-Schnitt: Passkeys, Redis, K8s sind explizit NICHT Phase 0 |
| Krypto-Eigenbau-Fehler | Review findet Ad-hoc-Krypto | Nur libsodium/Node-crypto-Standardmuster; externes Review vor Phase-2-Ende |
| Solo-Ausfall (Bus-Faktor 1) | — | IaC + Runbooks + Doku halten das System übergabefähig; Notfallkontakt mit Zugriffsplan |
| Beta zieht echte sensible Daten an, bevor Härtung fertig | Beta-Anmeldungen vor Phase 4 | Private Beta bleibt geladen + Warnhinweise bis Phase-4-Abschluss |
