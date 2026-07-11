# RLS_CONCEPT — Row Level Security & Zugriffsregeln

Version 0.1 · Stand Juli 2026 · Status: Entwurf
Bezug: SUPABASE_SCHEMA.md, SECURITY.md, PRIVACY_ARCHITECTURE.md

**Grundsatz:** „deny by default“. RLS ist auf **jeder** nutzerbezogenen Tabelle aktiv. Das Frontend nutzt ausschließlich den **anon/authenticated**-Key; der **Service-Role-Key** wird nie im Client verwendet (siehe §7). RLS ist die zweite Verteidigungslinie hinter einer zentralen Zugriffsschicht in der API.

---

## 1. Leitregeln (aus der Aufgabenstellung)

1. Nutzer sieht nur **eigene** Daten.
2. Nutzer sieht Daten **verwalteter Personen** nur mit Berechtigung (Rolle an der Person).
3. Unternehmen sieht nur **ausdrücklich freigegebene** Inhalte.
4. Die **Empfängeransicht** darf nur **gültige** Freigabeinhalte lesen.
5. **Widerrufene** Freigaben liefern **nichts**.
6. **Abgelaufene** Freigaben liefern **nichts**.
7. **Service Role** nie im Frontend.
8. **Auditlogs** nicht nachträglich vom normalen Nutzer veränderbar.
9. Organisationen sehen nur Daten des **eigenen Mandanten**.
10. **Private Dokumente** nie öffentlich.

---

## 2. Standardmuster für nutzereigene Tabellen

Für alle Tabellen mit `owner_user_id` (persons, profile_fields, custom_fields, documents, document_versions, cases, case_requirements, case_history, shares, share_versions, share_items, share_accesses, notifications, audit_events, consents, user_settings, user_profiles):

```sql
alter table <t> enable row level security;
alter table <t> force row level security;

-- Lesen/Schreiben nur eigener Zeilen
create policy sel_own on <t> for select using (owner_user_id = auth.uid());
create policy ins_own on <t> for insert with check (owner_user_id = auth.uid());
create policy upd_own on <t> for update using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy del_own on <t> for delete using (owner_user_id = auth.uid());
```

`user_profiles`/`user_settings` nutzen `user_id = auth.uid()` statt `owner_user_id`.

---

## 3. Verwaltete Personen & Vertrauensrollen (Leitregel 2)

Die Rolle steht an `persons.role` (`owner | managed | trust_read | trust_write`). In der Beta gehört alles demselben Nutzer; im Server-Modell kommen **geteilte** Personen dazu (eine Person eines Nutzers, die einem anderen Einblick gibt). Dafür eine Beziehungstabelle:

```sql
create table person_grants (
  id           uuid primary key default gen_random_uuid(),
  person_id    uuid not null references persons(id) on delete cascade,
  grantor_user_id uuid not null references auth.users(id) on delete cascade,  -- Eigentümer der Person
  grantee_user_id uuid not null references auth.users(id) on delete cascade,  -- Vertrauensperson
  role         person_role not null check (role in ('trust_read','trust_write')),
  created_at   timestamptz not null default now(),
  revoked_at   timestamptz,
  unique (person_id, grantee_user_id)
);
```

Hilfsfunktionen (SECURITY DEFINER, minimal):
```sql
create or replace function can_read_person(pid uuid) returns boolean language sql stable as $$
  select exists (select 1 from persons p where p.id = pid and p.owner_user_id = auth.uid())
      or exists (select 1 from person_grants g where g.person_id = pid and g.grantee_user_id = auth.uid()
                 and g.revoked_at is null);
$$;
create or replace function can_write_person(pid uuid) returns boolean language sql stable as $$
  select exists (select 1 from persons p where p.id = pid and p.owner_user_id = auth.uid())
      or exists (select 1 from person_grants g where g.person_id = pid and g.grantee_user_id = auth.uid()
                 and g.revoked_at is null and g.role = 'trust_write');
$$;
```

Auf personenbezogenen Datentabellen (profile_fields, custom_fields, documents, cases, …) wird das Standardmuster **erweitert**, sodass auch berechtigte Vertrauenspersonen lesen bzw. schreiben dürfen:
```sql
create policy sel_person on profile_fields for select using (can_read_person(person_id));
create policy mut_person on profile_fields for update using (can_write_person(person_id)) with check (can_write_person(person_id));
-- insert/delete analog mit can_write_person(...)
```
`trust_read` erhält nur SELECT; `trust_write` zusätzlich INSERT/UPDATE/DELETE. Der Eigentümer behält immer volle Rechte.

---

## 4. Empfängeransicht (Leitregeln 4–6, 10)

Die öffentliche Freigabeansicht läuft **ohne Login**. Sie darf **niemals** direkt per RLS aus `shares`/`share_items` lesen (der Empfänger ist nicht `auth.uid()`). Stattdessen: eine **serverseitige Funktion** (Edge Function bzw. `SECURITY DEFINER`-RPC) prüft Token, Ablauf, Widerruf und Passwort und liefert nur die freigegebenen Snapshot-Inhalte zurück.

```sql
-- Wird von einer Edge Function mit begrenzten Rechten aufgerufen; kein Klartext-Token in der DB.
create or replace function resolve_share(p_token_hash text, p_password_hash text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s shares; v share_versions;
begin
  select * into s from shares where token_hash = p_token_hash;
  if not found then return jsonb_build_object('error','not_found'); end if;
  if s.status = 'widerrufen' then return jsonb_build_object('error','revoked'); end if;    -- Leitregel 5
  select * into v from share_versions where share_id = s.id and version_no = s.current_version;
  if v.expires_at is not null and v.expires_at < current_date then
     return jsonb_build_object('error','expired');                                          -- Leitregel 6
  end if;
  if v.password_hash is not null and (p_password_hash is null or p_password_hash <> v.password_hash) then
     -- Fehlversuch protokollieren (über separate Funktion), dann:
     return jsonb_build_object('error','password_required');
  end if;
  -- Nur der Snapshot der gültigen Version wird zurückgegeben (keine Live-Profildaten).
  return jsonb_build_object(
    'person', s.person_id_display,  -- nur Anzeigename, keine internen IDs nötig
    'recipient', s.recipient, 'purpose', s.purpose,
    'expires_at', v.expires_at, 'permission', v.permission, 'message', v.message,
    'items', (select coalesce(jsonb_agg(to_jsonb(i) - 'owner_user_id'), '[]')
              from share_items i where i.share_version_id = v.id));
end $$;
```

Regeln dazu:
- `shares`, `share_versions`, `share_items` haben **keine** anon-SELECT-Policy. Zugriff nur über `resolve_share`.
- Datei-Download der Empfängeransicht: Die Edge Function erzeugt nach erfolgreicher `resolve_share`-Prüfung (und nur bei `permission='download'`) eine **kurzlebige signierte URL** für genau die eingefrorene `document_version_id`. Kein direkter Bucket-Zugriff.
- Jeder Aufruf schreibt nach `share_accesses` (geoeffnet / angesehen / heruntergeladen / passwort_fehler) — über eine `SECURITY DEFINER`-Funktion, nicht durch den anonymen Aufrufer direkt.

---

## 5. Audit & Append-only (Leitregel 8)

`audit_events`, `case_history`, `share_accesses`:
```sql
create policy sel_own on audit_events for select using (owner_user_id = auth.uid());
create policy ins_own on audit_events for insert with check (owner_user_id = auth.uid());
-- KEINE update/delete-Policy → für authenticated-Rolle sind UPDATE/DELETE damit verboten.
revoke update, delete on audit_events from authenticated, anon;
```
Endgültige Bereinigung (Retention) läuft nur über privilegierte, protokollierte Jobs (Service Role, serverseitig).

---

## 6. Organisationen / Mandanten (Leitregeln 3, 9)

Zugehörigkeit über `organization_users`. Hilfsfunktion:
```sql
create or replace function is_org_member(org uuid) returns boolean language sql stable as $$
  select exists (select 1 from organization_users ou where ou.organization_id = org and ou.user_id = auth.uid());
$$;
```
Policies auf `organizations`, `organization_requests`, `organization_request_items`, org-`request_templates`, org-`integration_connections`:
```sql
create policy org_read on organization_requests for select using (is_org_member(organization_id));
create policy org_write on organization_requests for all using (is_org_member(organization_id)) with check (is_org_member(organization_id));
```
- Ein Unternehmen sieht **nur** Zeilen seines eigenen `organization_id` (Mandanten-Trennung).
- Ein Unternehmen sieht **niemals** Profil-/Dokumentdaten von Privatnutzern direkt — nur das, was ihm über eine Freigabe zugestellt wurde (die als normale `share` beim Privatnutzer entsteht; die Org konsumiert sie über die Empfängeransicht/`resolve_share`).

---

## 7. Service Role & Schlüssel (Leitregel 7)

- **Frontend** verwendet ausschließlich `SUPABASE_ANON_KEY` (öffentlich, RLS-gebunden).
- **Service-Role-Key** (`SUPABASE_SERVICE_ROLE_KEY`) umgeht RLS und wird **nur** in serverseitigen Funktionen / Migrations-/Wartungs-Skripten genutzt, die nicht ausgeliefert werden. Nie in `NEXT_PUBLIC_*`, nie im Browser-Bundle. Ablage im Secret-Store der Plattform.
- Edge Functions mit erhöhten Rechten haben einen eng begrenzten Zweck (z. B. `resolve_share`) und validieren strikt.

---

## 8. Storage-Policies (Leitregel 10)

Bucket `documents` privat. Storage-RLS bindet Objekte an den Nutzer über den Pfad-Präfix:
```sql
-- Beispielhafte Storage-Policy (vereinfachte Form):
create policy doc_read on storage.objects for select
  using (bucket_id = 'documents' and (storage.foldername(name))[2] = auth.uid()::text);
create policy doc_write on storage.objects for insert
  with check (bucket_id = 'documents' and (storage.foldername(name))[2] = auth.uid()::text);
```
- Keine öffentlichen URLs; Zugriff nur über kurzlebige signierte URLs.
- Empfängerseitiger Download nur über die serverseitige, freigabe-geprüfte URL-Erzeugung (§4).

---

## 9. Testbarkeit

- Integrationstests fahren jede Policy gegen mindestens einen **positiven** und einen **negativen** Fall (fremder Nutzer sieht nichts; abgelaufene/widerrufene Freigabe liefert nichts; Vertrauensperson mit `trust_read` kann nicht schreiben). Vorbild: `webapp/tests/integration/rls.test.ts`.
- CI schlägt fehl, wenn eine nutzerbezogene Tabelle ohne aktivierte RLS existiert (Schema-Lint).
