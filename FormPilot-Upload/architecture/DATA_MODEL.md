# DATA_MODEL — Datenmodell FormPilot

Version 0.1 · Stand Juli 2026 · Status: Entwurf zur Freigabe
Notation: PostgreSQL. `enc` = Feld wird anwendungsseitig verschlüsselt gespeichert (SECURITY_MODEL.md §5). `*` = in v1 nur Schema (vorbereitet), keine Produkt-Funktion.

---

## 1. Überblick (Entitäten und Beziehungen)

```
users ─1:n─ sessions, mfa_credentials, devices
users ─1:n─ persons ─1:n─ person_fields ──n:1── field_definitions
                    └1:n─ documents ─1:n─ document_versions ──1:1── files
users ─1:n─ cases ─1:n─ case_items, case_events
users ─1:n─ packages ─1:n─ package_items
users ─1:n─ shares ─1:n─ share_items, share_access_events
persons ─1:n─ mandates (wer darf für wen handeln, Grundlage)
audit_events (append-only, referenziert alles per Typ+ID)
organizations* ─1:n─ org_members*, org_requests*
plans* ─1:n─ subscriptions* ─1:n─ entitlements*
api_clients*, api_usage*, webhook_endpoints*, webhook_deliveries*,
integration_connections*
```

Grundregeln:
- Alle IDs UUIDv7. Alle Tabellen mit `created_at`, `updated_at`.
- Kein hartes Löschen von auditrelevanten Objekten: `deleted_at` + Lösch-Workflow (DSGVO-Löschung entfernt Inhalte/Dateien, behält minimalen Tombstone im Audit).
- Mandantentrennung auf Zeilenebene: jede fachliche Tabelle trägt `owner_user_id`; jeder Query-Pfad läuft durch eine zentrale Zugriffsschicht (später zusätzlich RLS-Policies in PostgreSQL).

## 2. Identität & Konto

**users** — Konto des Menschen
`id, email (citext, unique), password_hash (argon2id), email_verified_at, assurance_level (enum: self_declared|substantial|high; v1 immer self_declared), locale, font_scale, status (active|locked|deletion_requested), deletion_requested_at`

**sessions** — Server-Sessions
`id, user_id, token_hash, created_at, last_seen_at, expires_at, ip_hash, user_agent, revoked_at`

**mfa_credentials**
`id, user_id, type (totp|webauthn), secret_enc (enc), webauthn_public_key, label, last_used_at, confirmed_at`

**devices** — angezeigte Geräteliste (aus Sessions abgeleitet, benannt)
`id, user_id, name, first_seen_at, last_seen_at, trusted`

**consents** — Einwilligungen mit Version und Zeitpunkt
`id, user_id, kind (privacy|terms|product_news), version, granted_at, revoked_at`

## 3. Personen, Mandate, Profilfelder

**persons** — natürliche Personen im Haushalt (inkl. „Ich“)
`id, owner_user_id, display_name, relation (self|child|parent|grandparent|partner|other), notes, birth_date (enc, optional)`

**mandates** — Grundlage, für eine andere Person zu handeln
`id, person_id (verwaltete Person), holder_user_id, kind (vorsorgevollmacht|betreuung|eltern|sonstige), evidence_document_id (FK documents, optional), valid_from, valid_until, note`
> v1: Selbstauskunft + optionaler Dokument-Nachweis. Keine rechtliche Prüfung durch FormPilot — das steht so im Produkt.

**field_definitions** — zentraler Feldkatalog (systemweit)
`id, key (steuerid|iban|svnr|…), label, help_text, group_key (identitaet|kontakt|arbeit|bank|versicherung|pflege|eigene), value_type (text|date|iban|number|bool), validation_rule, sensitive (bool), fim_id (nullable — Vorbereitung Kommunal/FIM), sort_order, active`

**person_fields** — Werte pro Person
`id, person_id, field_definition_id (nullable bei Eigenfeldern), custom_label (nur Eigenfelder), value_enc (enc), needs_review (bool), review_reason, last_used_at, use_count, source (manual|extraction|document|import)`

## 4. Dokumentensafe

**documents** — fachliches Dokument (versionsübergreifend)
`id, owner_user_id, person_id, title, category (enum wie Demo-Kategorien), valid_until (date, nullable), sensitive (bool), status (ok|expiring|expired — abgeleitet, materialisiert für Listen), last_shared_recipient_cache`

**document_versions**
`id, document_id, version_no, file_id, note, created_by_user_id, superseded_at`

**files** — physische Objekte im Objektspeicher
`id, storage_key, size_bytes, mime_type, sha256, enc_key_id (DEK-Referenz), enc_algo (aes-256-gcm), av_scan_status (pending|clean|infected|error), av_scanned_at, uploaded_by_user_id`

## 5. Vorgänge & Anforderungen

**cases** — Vorgang (Klammer um eine Anforderung)
`id, owner_user_id, person_id, title, recipient_name, organization_id* (nullable), purpose, deadline (date), status (open|partial|sent|declined|closed), source (manual|org*), request_text_enc (enc), suggested_share_days`

**case_items** — erkannter/gepflegter Posten der Checkliste
`id, case_id, field_definition_id (nullable), document_category/document_title (bei Dokument-Posten), item_type (data|doc), status (present|missing|review|upload), included (bool), unusual (bool), note`

**case_events** — Verlauf
`id, case_id, occurred_at, kind, description`

## 6. Pakete

**packages** `id, owner_user_id, person_id, name, note, created_from_case_id (nullable)`
**package_items** `id, package_id, item_type (document|field), document_id, person_field_id`

## 7. Freigaben (Kern der Übergabeschicht)

**shares**
`id, owner_user_id, person_id, recipient_name, organization_id* (nullable), purpose, status (active|expired|revoked), token_hash (unique — der Link enthält das Token, DB nur den Hash), password_hash (nullable, argon2id), allow_download (bool), message_enc (enc), expires_at, revoked_at, created_from_case_id, created_from_package_id, assurance_level_at_creation`

**share_items** — eingefrorener Inhalt zum Zeitpunkt der Freigabe
`id, share_id, item_type (data|doc), label, value_snapshot_enc (enc — Datenposten), document_version_id (Dokumentposten; Snapshot auf konkrete Version), sensitive (bool)`
> Snapshot-Prinzip: Spätere Profilländerungen verändern keine bestehende Freigabe. Widerruf beendet den Zugriff; bereits abgerufene Kopien sind dokumentiert nicht rückholbar.

**share_access_events** — lückenloses Empfänger-Protokoll
`id, share_id, occurred_at, kind (opened|viewed_item|downloaded|password_failed|expired_hit|revoked_hit), item_id (nullable), ip_hash, user_agent`

## 8. Audit, Benachrichtigung, DSGVO

**audit_events** — append-only, Quelle für Protokoll-UI und spätere Webhooks
`id, owner_user_id, actor (user|system|recipient|org*), event_type (namespaced, z. B. share.created, document.deleted, auth.login), object_type, object_id, summary (Alltagssprache, wie Demo), metadata (jsonb, ohne Klartext-Sensibles), occurred_at`
> Integrations-Vorbereitung: `audit_events` dient als Outbox — Webhook-Versand liest hieraus (INTEGRATION_ARCHITECTURE.md).

**notifications** `id, user_id, kind (deadline|access|expiry|system), title, body, read_at, dedupe_key`

**dsr_jobs** — Datenauskunft/-löschung (Data Subject Requests)
`id, user_id, kind (export|delete), status, requested_at, completed_at, artifact_file_id (Export-ZIP)`

## 9. Vorbereitete Tabellen (v1: Migration angelegt, Funktionen inaktiv)

**organizations*** `id, name, domain, verified_at, verification_method, contact_email, status`
**org_members*** `id, organization_id, user_id, role (admin|member)`
**org_requests*** `id, organization_id, target_email/target_user_id, purpose, items (jsonb — gleicher Postenkatalog wie case_items), deadline, requested_share_days, status, signature/verification_ref`
**plans*** `id, key (free|plus|family|org_*), name, price_cents, period, active`
**subscriptions*** `id, user_id/organization_id, plan_id, status, current_period_end, psp_customer_ref, psp_subscription_ref`
**entitlements*** `id, subject_type (user|org), subject_id, key (max_documents|max_persons|api_access|…), value, source_subscription_id`
**api_clients*** `id, owner_org_id, name, key_hash, scopes, rate_limit_tier, status`
**api_usage*** `id, api_client_id, period, endpoint_group, count` (Metering für API-Monetarisierung)
**webhook_endpoints*** `id, owner (user|org), url, secret_enc, event_filters, active`
**webhook_deliveries*** `id, endpoint_id, audit_event_id, status, attempts, last_attempt_at`
**integration_connections*** `id, owner, provider (personio|datev|sap|custom), config_enc, status`

## 10. Aufbewahrung & Löschung (Grundsätze)

| Datenart | Aufbewahrung |
|---|---|
| Profilwerte, Dokumente | bis Nutzer löscht bzw. Konto-Löschung (30-Tage-Widerrufsfenster, dann endgültig inkl. Objektspeicher) |
| Freigabe-Snapshots | bis Ablauf/Widerruf + 90 Tage (Nachvollziehbarkeit), dann Inhalte gelöscht, Metadaten bleiben im Audit |
| audit_events | 24 Monate rollierend (konfigurierbar), ohne sensible Klartexte |
| share_access_events | wie Freigabe, mindestens aber 12 Monate |
| Backups | 30 Tage; Löschkonzept dokumentiert, dass gelöschte Daten aus Backups nach Ablauf verschwinden |

## 11. Offene Modellfragen (zur Entscheidung)

1. Werte-Verschlüsselung pro Feld (feingranular, teurer) vs. pro Personen-Datensatz (gröber, einfacher) — Empfehlung: pro Feld nur für `sensitive`-Felder.
2. `birth_date` als eigenes Feld an `persons` vs. nur im Feldkatalog — Empfehlung: nur Feldkatalog (eine Quelle).
3. Row-Level-Security in PostgreSQL ab v1 oder erst ab Org-Portal — Empfehlung: Policies ab v1 anlegen, auch wenn App-Schicht primär prüft.
