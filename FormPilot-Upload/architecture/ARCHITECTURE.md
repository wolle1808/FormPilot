# ARCHITECTURE — Zielarchitektur FormPilot

Version 0.1 · Stand Juli 2026 · Status: Entwurf zur Freigabe
Kontext: PRODUCT_BOUNDARIES.md (Scope), SECURITY_MODEL.md (Sicherheit), HOSTING_DECISION.md (Betrieb)

---

## 1. Architekturprinzipien

1. **Übergabeschicht, nicht Plattform-Maximalismus:** Die Architektur optimiert auf sichere Verwahrung + kontrollierte Übergabe, nicht auf Workflow-Engines.
2. **Modularer Monolith vor Microservices:** Ein Deployment, klare Modulgrenzen. Ein Solo-/Kleinstteam betreibt keine Service-Landschaft zuverlässig.
3. **API-first:** Das Frontend ist der erste API-Konsument. Dieselbe API trägt später Org-Portal und Integrationen — keine Zweitarchitektur nötig.
4. **Ereignisprotokoll als Fundament:** Jede sicherheitsrelevante Aktion erzeugt ein Audit-Event. Das ist zugleich die spätere Webhook-/Integrations-Quelle.
5. **Boring Technology:** PostgreSQL, S3-kompatibler Objektspeicher, ein Backend-Prozess, ein Frontend. Jede Zusatzkomponente braucht eine Begründung.
6. **Vorbereiten heißt: Schema und Schnittstelle, nicht Code:** Org-Portal, Kommunal-Anbindung, BundID werden über Datenmodell-Platzhalter und stabile Verträge vorbereitet — nicht über halbfertige Features.

## 2. Systemübersicht (Zielbild MVP)

```
┌────────────────────────────────────────────────────────────────────┐
│  Clients                                                           │
│  • Web-App (PWA, responsive) — einzige UI in v1                    │
│  • Empfänger-Ansicht (öffentliche, tokenisierte Freigabe-Seite)    │
└──────────────┬─────────────────────────────────────────────────────┘
               │ HTTPS (TLS 1.2+), Session-Cookie bzw. Share-Token
┌──────────────▼─────────────────────────────────────────────────────┐
│  FormPilot Backend — modularer Monolith (Node.js/TypeScript)       │
│                                                                    │
│  identity   │ profiles  │ vault      │ cases     │ shares          │
│  (Auth,2FA, │ (Personen,│ (Dokumente,│ (Vorgänge,│ (Freigaben,     │
│  Sessions,  │ Felder,   │ Versionen, │ Anforder- │ Empfängerlinks, │
│  Geräte)    │ Mandate)  │ Dateien)   │ ungen)    │ Zugriffslog)    │
│  ───────────┴───────────┴────────────┴───────────┴──────────────── │
│  packages │ audit │ notifications │ export/dsr │ billing* │ orgs*  │
│  (*= Modul-Skelett + Schema, kein v1-Feature)                      │
│                                                                    │
│  Querschnitt: AuthZ (RBAC+Mandate), Crypto (Envelope), Jobs,       │
│  Rate-Limits, Validierung (ein Schema für API+Frontend)            │
└───────┬──────────────────┬──────────────────┬──────────────────────┘
        │                  │                  │
┌───────▼──────┐  ┌────────▼────────┐  ┌──────▼───────────┐
│ PostgreSQL 16│  │ Objektspeicher  │  │ Hintergrundjobs  │
│ (Stammdaten, │  │ (S3-kompatibel, │  │ (gleicher Prozess│
│ Audit, PITR- │  │ verschlüsselte  │  │ oder Worker:     │
│ Backups)     │  │ Dokumente)      │  │ Mail, Ablauf,    │
└──────────────┘  └─────────────────┘  │ Virenscan, DSR)  │
                                       └──────────────────┘
Extern (EU, per AVV): E-Mail-Versand · Fehler-Monitoring · später PSP
```

## 3. Technologie-Entscheidungen (mit Begründung)

| Baustein | Entscheidung | Begründung / Alternative |
|---|---|---|
| Backend | Node.js 22 + TypeScript, Fastify (oder NestJS), modularer Monolith | Ein Sprach-Stack für Front+Back, großes Ökosystem; Go wäre gleichwertig, bringt aber Zweitsprache |
| Frontend | React + TypeScript + Vite, als PWA | Reifes Ökosystem, Formulare/A11y-Bibliotheken; Design-Tokens aus Brand-Guideline werden 1:1 übernommen. Die bestehende Vanilla-Demo bleibt als Prototyp erhalten (MIGRATION_PLAN.md) |
| API | REST + OpenAPI-Spezifikation, versioniert (`/v1`) | Integrations-tauglich, generierbare Clients; GraphQL bietet hier keinen Mehrwert |
| Datenbank | PostgreSQL 16, SQL-Migrationen (z. B. Drizzle/Atlas), PITR-Backups | Relationale Integrität für Freigaben/Audit zwingend; JSONB für flexible Feldwerte |
| Objektspeicher | S3-kompatibel (Hetzner Object Storage, DE) | Dokumente gehören nicht in die DB; Verschlüsselung s. SECURITY_MODEL.md |
| Sessions/Cache | PostgreSQL zuerst; Redis erst bei nachgewiesenem Bedarf | Komponentensparsamkeit |
| Jobs | In-Process-Queue (z. B. pg-boss auf PostgreSQL) | Kein separates Broker-System nötig |
| Auth | Eigene schlanke Implementierung nach OWASP ASVS: argon2id, Session-Cookies (httpOnly, SameSite), TOTP-2FA, Passkeys ab v1.x | Keycloak/Ory sind mächtiger, aber Betriebslast; Auth-SaaS (US) kollidiert mit Residenz-Zielen |
| Deployment | Docker Compose auf 2 VMs (App+DB getrennt), IaC per Terraform/Ansible | K8s ist für ein Ein-Personen-Ops-Team unangemessen |
| Observability | Structured Logs (Loki/Grafana oder journald+Promtail), Uptime-Check, Fehler-Tracking EU (Sentry-EU oder GlitchTip self-hosted) | Kein US-Analytics; Produkt-Metriken über eigene, aggregierte Events |

## 4. Modulgrenzen und vorbereitete Erweiterungspunkte

**v1-aktive Module:** identity, profiles, vault, cases, packages, shares, audit, notifications, export/dsr (Datenauskunft/-löschung).

**Vorbereitete Module (Schema + leere Service-Schnittstelle, keine UI):**

| Modul | Erweiterungspunkt heute | Aktiviert später durch |
|---|---|---|
| orgs | `organizations`-Tabelle; jede Freigabe referenziert optional eine Organisation statt nur Freitext-Empfänger | Org-Portal (Anfragen stellen, Status sehen) |
| requests-inbound | Anforderungs-Postenkatalog ist bereits das interne Schema; Quelle „org“ vs. „manuell“ am Vorgang | Signierte Org-Anfragen, Verifizierter-Absender-Modell |
| billing | `plans`, `subscriptions`, `entitlements`; Feature-Gates lesen ausschließlich Entitlements | Freemium-Launch, PSP-Anbindung (MONETIZATION_ARCHITECTURE.md) |
| integrations | Audit-Events als Outbox; `webhook_endpoints`, `api_clients` (Schema) | Webhooks, Personio-/DATEV-Konnektoren (INTEGRATION_ARCHITECTURE.md) |
| identity-assurance | `assurance_level` an Nutzer und Freigabe (self_declared heute) | BundID/eID-Anbindung hebt Level auf „substanziell/hoch“ |
| fim-mapping | `field_definitions.fim_id` (nullable) | Kommunale Prozesse, FIM/XÖV-Export |

## 5. Nicht-funktionale Anforderungen (v1-Ziele)

| NFR | Ziel v1 |
|---|---|
| Verfügbarkeit | 99,5 % monatlich (Einzelregion, kein HA-Anspruch); RTO ≤ 4 h, RPO ≤ 15 min (PITR) |
| Performance | P95 API < 300 ms; Dokument-Download startet < 1 s |
| Skalierung | Bis ~50 k Nutzer ohne Architekturwechsel (vertikal + Read-Replica-Option) |
| Sicherheit | OWASP ASVS Level 2 als Referenzrahmen; Details SECURITY_MODEL.md |
| Datenschutz | DSGVO-Pflichten produktseitig (Export, Löschung, Auskunft) automatisiert |
| Barrierefreiheit | WCAG 2.1 AA für Kern-Flows (Brand-Guideline-Zielgruppe 60+) |

## 6. Bewusste Architektur-Schulden (akzeptiert, dokumentiert)

- Kein Multi-Region-Betrieb, kein Zero-Downtime-Deployment in v1.
- Keine Ende-zu-Ende-Verschlüsselung in v1 (Begründung und Weg dazu: SECURITY_MODEL.md §6).
- Kein eigenes KMS/HSM in v1; Schlüsselhierarchie softwarebasiert mit dokumentierten Grenzen.
- Volltextsuche zunächst über PostgreSQL, keine Suchmaschine.

## 7. Architektur-Entscheidungsregister (ADR-Kurzliste)

| # | Entscheidung | Status |
|---|---|---|
| ADR-1 | Modularer Monolith statt Microservices | angenommen |
| ADR-2 | Neubau des Frontends statt Ausbau der Demo-Datei | angenommen (MIGRATION_PLAN.md) |
| ADR-3 | PostgreSQL als einziges Quellsystem für Zustand + Audit | angenommen |
| ADR-4 | Hosting Deutschland, Provider-Empfehlung Hetzner | zur Freigabe (HOSTING_DECISION.md) |
| ADR-5 | Server-seitige Envelope-Verschlüsselung, kein E2E in v1 | zur Freigabe (SECURITY_MODEL.md) |
| ADR-6 | PSP-Wahl (Stripe vs. Mollie) | offen (MONETIZATION_ARCHITECTURE.md) |
