# SUPABASE_SCHEMA — Datenbankschema (Supabase / PostgreSQL)

Version 0.1 · Stand Juli 2026 · Status: Entwurf
Bezug: DATA_MODEL.md (fachliches Modell), RLS_CONCEPT.md (Zugriffsregeln), PRIVACY_ARCHITECTURE.md, MIGRATION_PLAN.md

**Zweck:** Vollständiges Zieltabellenmodell für den Wechsel von der lokalen Beta (localStorage/IndexedDB) auf Supabase. Dieses Dokument beschreibt Tabellen, Spalten, Beziehungen und Indizes. Die Zugriffsregeln (Row Level Security) stehen in `RLS_CONCEPT.md`. Storage (Dateien) und Freigabetoken stehen weiter unten.

Grundsätze:
- **Postgres + RLS.** Jede nutzerbezogene Tabelle hat RLS aktiviert; „deny by default“.
- **Ein Eigentümer.** Nutzerdaten hängen an `owner_user_id → auth.users(id)`.
- **Soft-Delete + Audit.** `deleted_at`/`archived_at` statt Hard-Delete, wo Nachvollziehbarkeit zählt; endgültige Löschung über einen dedizierten Lösch-Job.
- **Binärdaten getrennt.** Dateien liegen im Storage (privater Bucket), nur Metadaten in der DB.

---

## 0. Konventionen — gemeinsame Spalten

Jede **nutzerbezogene** Tabelle enthält:

| Spalte | Typ | Regel |
|---|---|---|
| `id` | `uuid` PK | `default gen_random_uuid()` |
| `owner_user_id` | `uuid` NOT NULL | `references auth.users(id) on delete cascade` |
| `person_id` | `uuid` NULL | `references persons(id) on delete cascade` (wo eine Zuordnung zu einer Person sinnvoll ist) |
| `created_at` | `timestamptz` NOT NULL | `default now()` |
| `updated_at` | `timestamptz` NOT NULL | `default now()`, per Trigger gepflegt |
| `archived_at` | `timestamptz` NULL | gesetzt = archiviert (nicht mehr in Standardlisten) |
| `deleted_at` | `timestamptz` NULL | gesetzt = im Papierkorb / soft-deleted |

Globaler Trigger `set_updated_at()` auf allen Tabellen. Enums als `create type`. Alle FKs mit passender `on delete`-Regel. Indizes: auf jedem FK, auf `owner_user_id`, auf häufigen Filterspalten.

```sql
create extension if not exists "pgcrypto";  -- gen_random_uuid, digest

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
```

---

## 1. Identität & Konto

### auth.users (von Supabase verwaltet)
E-Mail, verschlüsseltes Passwort, `email_confirmed_at`, MFA-Faktoren. Wir schreiben hier **nicht** direkt hinein; wir verknüpfen über `owner_user_id`.

### user_profiles
Öffentlich-fachliches Profil des Kontoinhabers (1:1 zu auth.users). Nicht zu verwechseln mit `persons` (den Personenprofilen im Produkt).
```sql
create table user_profiles (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  locale        text not null default 'de',
  assurance_level text not null default 'self_declared',  -- self_declared | verified (später eID/BundID)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
```

### user_settings
```sql
create table user_settings (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  font_zoom      int  not null default 100 check (font_zoom in (100,110,120)),
  notify_deadlines boolean not null default true,
  notify_expiry  boolean not null default true,
  notify_access  boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
```

### consents
Einwilligungen mit Fassung und Zeitpunkt (DSGVO-Nachweis). Historie durch Append: pro Zustimmung eine Zeile, aktueller Stand = neueste je `consent_id`.
```sql
create type consent_kind as enum ('datenschutz','nutzung','produktinfos');
create table consents (
  id           uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  consent_id   consent_kind not null,
  version      text not null,               -- z. B. '1.0'
  accepted     boolean not null,            -- true = erteilt, false = widerrufen
  accepted_at  timestamptz not null default now(),
  ip_hash      text,                        -- optional, gehasht (kein Klartext-IP)
  user_agent   text,
  created_at   timestamptz not null default now()
);
create index on consents (owner_user_id, consent_id, accepted_at desc);
```

---

## 2. Personen & Profildaten

### persons
Eigenes Profil + verwaltete Personen (Angehörige).
```sql
create type person_relation as enum ('ich','partner','kind','elternteil','grosselternteil','betreute_person');
create type person_role as enum ('owner','managed','trust_read','trust_write');
create table persons (
  id             uuid primary key default gen_random_uuid(),
  owner_user_id  uuid not null references auth.users(id) on delete cascade,
  name           text not null,
  relation       person_relation not null default 'ich',
  role           person_role not null default 'owner',
  vollmacht_document_id uuid references documents(id) on delete set null,
  vollmacht_valid_until date,
  vollmacht_note text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  archived_at    timestamptz,
  deleted_at     timestamptz
);
create index on persons (owner_user_id);
```

### profile_fields
Standardfelder je Person (Katalog-basiert; `field_key` referenziert den Feldkatalog aus dem Frontend/Seed).
```sql
create table profile_fields (
  id            uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  person_id     uuid not null references persons(id) on delete cascade,
  field_key     text not null,              -- z. B. 'iban','steuerid'
  value         text,                        -- (Anwendungsschicht kann sensible Werte zusätzlich verschlüsseln)
  is_sensitive  boolean not null default false,
  source        text,                        -- 'manuell','aus_dokument:<name>','demo'
  confirmed_at  date,
  last_used_at  date,
  last_shared_with text,
  needs_review  boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (person_id, field_key)
);
create index on profile_fields (owner_user_id);
create index on profile_fields (person_id);
```

### custom_fields
Eigene Felder (Text / Nummer-Kennung / Datum), optional sensibel, optional mit Gültigkeit/Erinnerung.
```sql
create type custom_field_type as enum ('text','number','date');
create table custom_fields (
  id            uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  person_id     uuid not null references persons(id) on delete cascade,
  label         text not null,
  field_type    custom_field_type not null default 'text',
  value         text,
  is_sensitive  boolean not null default false,
  valid_until   date,
  reminder      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  archived_at   timestamptz,
  deleted_at    timestamptz
);
create index on custom_fields (person_id);
```

---

## 3. Dokumente

### documents
Metadaten. Die aktuelle Datei ist die neueste `document_versions`-Zeile.
```sql
create type document_status as enum ('vollstaendig','pruefen','laeuft_ab','abgelaufen','ersetzt','archiviert');
create table documents (
  id            uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  person_id     uuid not null references persons(id) on delete cascade,
  name          text not null,
  category      text not null default 'Sonstiges',
  valid_until   date,
  needs_review  boolean not null default false,
  last_shared_with text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  archived_at   timestamptz,
  deleted_at    timestamptz          -- Papierkorb; endgültige Löschung per Job nach 30 Tagen
);
create index on documents (person_id);
create index on documents (owner_user_id);
```

### document_versions
Versionierung; jede Version zeigt auf ein Storage-Objekt (nur Pfad/Metadaten, keine Binärdaten).
```sql
create table document_versions (
  id             uuid primary key default gen_random_uuid(),
  owner_user_id  uuid not null references auth.users(id) on delete cascade,
  document_id    uuid not null references documents(id) on delete cascade,
  version_no     int  not null,
  storage_path   text not null,       -- z. B. 'u/<user_id>/p/<person_id>/d/<doc_id>/<version_id>.pdf'
  content_type   text not null,       -- application/pdf | image/jpeg | image/png | image/heic
  file_size      bigint not null,
  sha256         text,                -- Integritätsprüfung
  note           text,
  created_at     timestamptz not null default now(),
  unique (document_id, version_no)
);
create index on document_versions (document_id);
```

---

## 4. Vorgänge

### cases
```sql
create type case_status as enum ('offen','unvollstaendig','bereit','uebermittelt','wartet_rueckmeldung','erledigt','abgelehnt','archiviert');
create table cases (
  id            uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  person_id     uuid not null references persons(id) on delete cascade,
  title         text not null,
  template_key  text,                -- 'arbeitgeber','bewerbung',...
  recipient     text,
  contact       text,
  sender        text,
  purpose       text,
  deadline      date,
  reminder_at   date,
  file_number   text,                -- Aktenzeichen
  case_number   text,                -- Vorgangsnummer
  note          text,
  status        case_status not null default 'offen',
  status_manual case_status,         -- gesetzt, wenn Nutzer den Status manuell übersteuert
  request_text  text,                -- ursprünglicher Anforderungstext
  source_document_id uuid references documents(id) on delete set null,
  share_id      uuid,                -- gesetzt, sobald eine Freigabe erstellt wurde
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  archived_at   timestamptz,
  deleted_at    timestamptz
);
create index on cases (person_id);
create index on cases (owner_user_id, status);
```

### case_requirements
Benötigte Angaben und Dokumente je Vorgang (Positionen der Anforderung).
```sql
create type requirement_kind as enum ('field','document');
create table case_requirements (
  id            uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  case_id       uuid not null references cases(id) on delete cascade,
  kind          requirement_kind not null,
  field_key     text,                -- bei kind='field'
  label         text,                -- bei kind='document'
  category      text,                -- bei kind='document'
  document_id   uuid references documents(id) on delete set null,  -- verknüpftes Dokument
  optional      boolean not null default false,
  unusual_note  text,                -- „für diesen Zweck ungewöhnlich“
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on case_requirements (case_id);
```

### case_history
Verlauf (append-only, nicht editierbar).
```sql
create table case_history (
  id           uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  case_id      uuid not null references cases(id) on delete cascade,
  entry_date   date not null default current_date,
  text         text not null,
  created_at   timestamptz not null default now()
);
create index on case_history (case_id);
```

---

## 5. Freigaben

### shares
Eine Freigabe = ein Empfänger + ein Zweck; die Inhalte liegen in Versionen (`share_items` je Version).
```sql
create type share_status as enum ('entwurf','aktiv','widerrufen');       -- 'abgelaufen' wird aus expires_at abgeleitet
create type share_permission as enum ('view','download');
create table shares (
  id            uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  person_id     uuid not null references persons(id) on delete cascade,
  case_id       uuid references cases(id) on delete set null,
  recipient     text not null,
  purpose       text,
  status        share_status not null default 'entwurf',
  current_version int not null default 1,
  token_hash    text unique,          -- SHA-256(token + pepper); Klartext-Token NIE gespeichert
  token_prefix  text,                 -- kurzer, nicht-geheimer Präfix zur Anzeige/Suche
  revoked_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  archived_at   timestamptz,
  deleted_at    timestamptz
);
create index on shares (owner_user_id);
create unique index on shares (token_hash) where token_hash is not null;
```

### share_versions
Jede inhaltliche Änderung erzeugt eine neue Version; alte bleiben erhalten (Datenregel „keine stille Änderung“).
```sql
create table share_versions (
  id            uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  share_id      uuid not null references shares(id) on delete cascade,
  version_no    int  not null,
  expires_at    date,                 -- NULL = ohne Ablauf
  permission    share_permission not null default 'download',
  password_hash text,                 -- optional; argon2/bcrypt, nie Klartext
  message       text,
  reason        text,                 -- Grund der neuen Version
  accepted      boolean not null default false,
  accepted_at   timestamptz,
  created_at    timestamptz not null default now(),
  unique (share_id, version_no)
);
create index on share_versions (share_id);
```

### share_items
Eingefrorene Inhalte (Snapshot) je Freigabeversion — Werte und Dokumentversionen zum Freigabezeitpunkt.
```sql
create table share_items (
  id               uuid primary key default gen_random_uuid(),
  owner_user_id    uuid not null references auth.users(id) on delete cascade,
  share_version_id uuid not null references share_versions(id) on delete cascade,
  kind             requirement_kind not null,     -- 'field' | 'document'
  -- kind='field':
  field_key        text,
  field_label      text,
  field_value      text,                           -- Snapshot des Werts zum Freigabezeitpunkt
  is_sensitive     boolean not null default false,
  -- kind='document':
  document_id      uuid references documents(id) on delete set null,
  document_version_id uuid references document_versions(id) on delete set null,  -- eingefrorene Version
  document_name    text,
  sort_order       int not null default 0,
  created_at       timestamptz not null default now()
);
create index on share_items (share_version_id);
```

### share_accesses
Zugriffsprotokoll der Empfängeransicht (serverseitig geschrieben).
```sql
create type access_event as enum ('erstellt','geoeffnet','angesehen','heruntergeladen','passwort_fehler','verlaengert','widerrufen','abgelaufen','bestaetigt','version');
create table share_accesses (
  id            uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,   -- für RLS des Eigentümers
  share_id      uuid not null references shares(id) on delete cascade,
  share_version_no int,
  event         access_event not null,
  detail        text,
  ip_hash       text,                 -- gehasht, kein Klartext
  user_agent    text,
  created_at    timestamptz not null default now()
);
create index on share_accesses (share_id, created_at desc);
```

---

## 6. Mitteilungen & Audit

### notifications
```sql
create type notification_kind as enum ('anfrage','frist','ablauf','zugriff','freigabe','sicherheit','erinnerung');
create table notifications (
  id            uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  kind          notification_kind not null,
  text          text not null,
  route         text,                 -- App-Ziel beim Antippen
  dedupe_key    text,                 -- verhindert Doppel-Benachrichtigungen
  read_at       timestamptz,
  created_at    timestamptz not null default now(),
  unique (owner_user_id, dedupe_key)
);
create index on notifications (owner_user_id, created_at desc);
```

### audit_events
Manipulationsarmes Aktivitätsprotokoll. **Append-only** (keine UPDATE/DELETE-Policy für normale Nutzer, siehe RLS_CONCEPT.md).
```sql
create type audit_kind as enum (
  'anmeldung','profil','dokument','version','loeschung','vorgang',
  'freigabe','zugriff','download','widerruf','ablauf','export','konto');
create table audit_events (
  id            uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  person_id     uuid references persons(id) on delete set null,
  kind          audit_kind not null,
  text          text not null,        -- verständliche Beschreibung
  entity_type   text,                 -- 'document','share',...
  entity_id     uuid,
  created_at    timestamptz not null default now()
);
create index on audit_events (owner_user_id, created_at desc);
```

---

## 7. Unternehmen (Mandanten) — nur Schema, kein Portal in dieser Phase

### organizations
```sql
create table organizations (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text unique,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  archived_at  timestamptz,
  deleted_at   timestamptz
);
```

### organization_users
Mitgliedschaft + Rolle (Mandanten-Trennung).
```sql
create type org_role as enum ('owner','admin','member','viewer');
create table organization_users (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            org_role not null default 'member',
  created_at      timestamptz not null default now(),
  unique (organization_id, user_id)
);
create index on organization_users (user_id);
```

### organization_requests
Strukturierte Unternehmensanfrage (Format `formpilot-request/v1`). Entspricht der im Frontend vorbereiteten Schnittstelle.
```sql
create type org_request_status as enum ('entwurf','gesendet','beantwortet','zurueckgezogen','abgelaufen');
create table organization_requests (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  created_by      uuid references auth.users(id) on delete set null,
  target_email    text,               -- an wen die Anfrage geht (Privatnutzer)
  purpose         text,
  deadline        date,
  file_number     text,
  case_number     text,
  status          org_request_status not null default 'entwurf',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on organization_requests (organization_id);
```

### organization_request_items
```sql
create table organization_request_items (
  id           uuid primary key default gen_random_uuid(),
  request_id   uuid not null references organization_requests(id) on delete cascade,
  kind         requirement_kind not null,   -- 'field' | 'document'
  field_key    text,
  label        text,
  category     text,
  optional     boolean not null default false,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);
create index on organization_request_items (request_id);
```

### request_templates
Wiederverwendbare Vorlagen (privat je Nutzer ODER je Organisation).
```sql
create table request_templates (
  id              uuid primary key default gen_random_uuid(),
  owner_user_id   uuid references auth.users(id) on delete cascade,
  organization_id uuid references organizations(id) on delete cascade,
  name            text not null,
  template_key    text,
  definition      jsonb not null,     -- Felder/Dokumente/Standardwerte
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (owner_user_id is not null or organization_id is not null)
);
```

### integration_connections
Verbindungen zu externen Systemen (z. B. Personio) — Metadaten und Status, **keine Secrets in der DB** (Tokens im Secret-Store / verschlüsselt).
```sql
create type integration_provider as enum ('personio','datev','other');
create type integration_status as enum ('pending','connected','error','revoked');
create table integration_connections (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  owner_user_id   uuid references auth.users(id) on delete cascade,
  provider        integration_provider not null,
  status          integration_status not null default 'pending',
  external_ref    text,                -- ID beim Anbieter (kein Secret)
  secret_ref      text,                -- Zeiger auf den Secret-Store, nicht das Secret selbst
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  revoked_at      timestamptz,
  check (owner_user_id is not null or organization_id is not null)
);
```

---

## 8. Storage (Dateien)

- **Privater Bucket** `documents` (nicht öffentlich). Keine öffentlichen URLs.
- **Pfad-Konvention** trennt nach Nutzer und Person:
  `u/<owner_user_id>/p/<person_id>/d/<document_id>/<document_version_id>.<ext>`
- **Signierte URLs** kurzlebig (z. B. 60 s), serverseitig erzeugt, nur nach RLS-/Freigabe-Prüfung.
- **Löschung:** Beim endgültigen Löschen eines Dokuments werden zugehörige Storage-Objekte über einen serverseitigen Job entfernt (Metadaten in `document_versions` + Objekt).
- **Metadaten getrennt:** DB speichert `storage_path`, `content_type`, `file_size`, `sha256` — nie die Binärdaten selbst.
- **Virenscan:** später, als asynchroner Schritt beim Upload (Status `pending_scan` → `clean`/`infected`), vor dem ersten Teilen.

Details der Zugriffslogik: `RLS_CONCEPT.md` (Abschnitt Storage) und `SECURITY.md`.

---

## 9. Indizes & Integrität (Kurzüberblick)

- FK-Indizes auf allen `*_id`-Spalten (oben je Tabelle angelegt).
- `owner_user_id`-Index auf allen nutzerbezogenen Tabellen (RLS-Performance).
- Eindeutigkeiten: `profile_fields(person_id, field_key)`, `document_versions(document_id, version_no)`, `share_versions(share_id, version_no)`, `shares(token_hash)`, `notifications(owner_user_id, dedupe_key)`, `organization_users(organization_id, user_id)`.
- Trigger `set_updated_at` auf allen Tabellen mit `updated_at`.
- Append-only-Tabellen (`audit_events`, `case_history`, `share_accesses`): kein UPDATE/DELETE für Nutzerrollen (RLS).
