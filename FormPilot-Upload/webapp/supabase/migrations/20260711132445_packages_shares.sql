-- ─────────────────────────────────────────────────────────────────────────────
-- Pakete & Freigaben: Paketbildung aus Vorgängen, Share-Snapshots, Token-Preview
-- Referenz: architecture/DATA_MODEL.md §6-§7, SECURITY_MODEL.md §8
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pgcrypto;

do $$
begin
  create type public.package_item_type as enum ('document', 'field');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.share_status as enum ('active', 'expired', 'revoked');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.share_item_type as enum ('data', 'doc');
exception
  when duplicate_object then null;
end $$;

create table public.packages (
  id                   uuid primary key default gen_random_uuid(),
  owner_user_id        uuid not null references auth.users (id) on delete cascade,
  person_id            uuid not null references public.persons (id) on delete restrict,
  name                 text not null check (char_length(name) between 2 and 160),
  note                 text check (note is null or char_length(note) <= 1000),
  created_from_case_id uuid references public.cases (id) on delete set null,
  deleted_at           timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

comment on table public.packages is
  'Wiederverwendbare Bündel aus Dokumenten und später Profilfeldern. In Phase 1 aus Vorgangs-Checklisten erzeugt.';

create index packages_owner_idx on public.packages (owner_user_id, deleted_at);
create index packages_person_idx on public.packages (person_id);
create index packages_created_from_case_idx on public.packages (created_from_case_id);

create trigger packages_set_updated_at
  before update on public.packages
  for each row execute function public.set_updated_at();

create table public.package_items (
  id              uuid primary key default gen_random_uuid(),
  package_id      uuid not null references public.packages (id) on delete cascade,
  item_type       public.package_item_type not null default 'document',
  document_id     uuid references public.documents (id) on delete restrict,
  person_field_id uuid,
  created_at      timestamptz not null default now(),
  constraint package_items_has_target
    check (
      (item_type = 'document' and document_id is not null and person_field_id is null)
      or (item_type = 'field' and person_field_id is not null and document_id is null)
    )
);

comment on table public.package_items is
  'Inhalte eines Pakets. Phase 1 unterstützt Dokumente, person_fields folgen später.';

create index package_items_package_idx on public.package_items (package_id);
create index package_items_document_idx on public.package_items (document_id);

create table public.shares (
  id                          uuid primary key default gen_random_uuid(),
  owner_user_id               uuid not null references auth.users (id) on delete cascade,
  person_id                   uuid not null references public.persons (id) on delete restrict,
  recipient_name              text not null check (char_length(recipient_name) between 2 and 160),
  purpose                     text not null check (char_length(purpose) between 2 and 500),
  status                      public.share_status not null default 'active',
  token_hash                  text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  password_hash               text,
  allow_download              boolean not null default false,
  message                     text check (message is null or char_length(message) <= 1000),
  expires_at                  timestamptz not null,
  revoked_at                  timestamptz,
  created_from_case_id        uuid references public.cases (id) on delete set null,
  created_from_package_id     uuid references public.packages (id) on delete set null,
  assurance_level_at_creation text not null default 'self_declared',
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

comment on table public.shares is
  'Freigaben mit gehashtem Link-Token. Das Klartext-Token wird nicht gespeichert und ist nur direkt nach Erstellung sichtbar.';

create index shares_owner_idx on public.shares (owner_user_id, status);
create index shares_person_idx on public.shares (person_id);
create index shares_package_idx on public.shares (created_from_package_id);
create index shares_expires_at_idx on public.shares (expires_at);

create trigger shares_set_updated_at
  before update on public.shares
  for each row execute function public.set_updated_at();

create table public.share_items (
  id                  uuid primary key default gen_random_uuid(),
  share_id            uuid not null references public.shares (id) on delete cascade,
  item_type           public.share_item_type not null default 'doc',
  label               text not null check (char_length(label) between 1 and 200),
  document_version_id uuid references public.document_versions (id) on delete restrict,
  sensitive           boolean not null default true,
  created_at          timestamptz not null default now(),
  constraint share_items_doc_has_version
    check (item_type <> 'doc' or document_version_id is not null)
);

comment on table public.share_items is
  'Eingefrorene Inhalte einer Freigabe. Dokumente zeigen auf eine konkrete Version.';

create index share_items_share_idx on public.share_items (share_id);
create index share_items_document_version_idx on public.share_items (document_version_id);

create table public.share_access_events (
  id          uuid primary key default gen_random_uuid(),
  share_id    uuid not null references public.shares (id) on delete cascade,
  occurred_at timestamptz not null default now(),
  kind        text not null check (char_length(kind) between 2 and 80),
  item_id     uuid references public.share_items (id) on delete set null,
  user_agent  text check (user_agent is null or char_length(user_agent) <= 500)
);

comment on table public.share_access_events is
  'Empfänger-Zugriffsprotokoll. In Phase 1 ohne IP-Hash, um keine sensiblen Logs vorzutäuschen.';

create index share_access_events_share_idx on public.share_access_events (share_id, occurred_at desc);

alter table public.packages enable row level security;
alter table public.package_items enable row level security;
alter table public.shares enable row level security;
alter table public.share_items enable row level security;
alter table public.share_access_events enable row level security;

create policy "packages_select_own"
  on public.packages for select
  to authenticated
  using (owner_user_id = (select auth.uid()));

create policy "packages_insert_own"
  on public.packages for insert
  to authenticated
  with check (
    owner_user_id = (select auth.uid())
    and exists (
      select 1 from public.persons p
      where p.id = person_id and p.owner_user_id = (select auth.uid())
    )
  );

create policy "packages_update_own"
  on public.packages for update
  to authenticated
  using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));

create policy "package_items_select_own"
  on public.package_items for select
  to authenticated
  using (
    exists (
      select 1 from public.packages p
      where p.id = package_id and p.owner_user_id = (select auth.uid())
    )
  );

create policy "package_items_insert_own"
  on public.package_items for insert
  to authenticated
  with check (
    exists (
      select 1 from public.packages p
      where p.id = package_id and p.owner_user_id = (select auth.uid())
    )
    and (
      document_id is null
      or exists (
        select 1 from public.documents d
        where d.id = document_id and d.owner_user_id = (select auth.uid())
      )
    )
  );

create policy "shares_select_own"
  on public.shares for select
  to authenticated
  using (owner_user_id = (select auth.uid()));

create policy "shares_insert_own"
  on public.shares for insert
  to authenticated
  with check (
    owner_user_id = (select auth.uid())
    and exists (
      select 1 from public.persons p
      where p.id = person_id and p.owner_user_id = (select auth.uid())
    )
  );

create policy "shares_update_own"
  on public.shares for update
  to authenticated
  using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));

create policy "share_items_select_own"
  on public.share_items for select
  to authenticated
  using (
    exists (
      select 1 from public.shares s
      where s.id = share_id and s.owner_user_id = (select auth.uid())
    )
  );

create policy "share_items_insert_own"
  on public.share_items for insert
  to authenticated
  with check (
    exists (
      select 1 from public.shares s
      where s.id = share_id and s.owner_user_id = (select auth.uid())
    )
  );

create policy "share_access_events_select_own"
  on public.share_access_events for select
  to authenticated
  using (
    exists (
      select 1 from public.shares s
      where s.id = share_id and s.owner_user_id = (select auth.uid())
    )
  );

revoke all on public.packages from anon;
revoke all on public.package_items from anon;
revoke all on public.shares from anon;
revoke all on public.share_items from anon;
revoke all on public.share_access_events from anon;

grant select, insert, update on public.packages to authenticated;
grant select, insert on public.package_items to authenticated;
grant select, insert, update on public.shares to authenticated;
grant select, insert on public.share_items to authenticated;
grant select on public.share_access_events to authenticated;

create or replace function public.get_share_preview(
  p_token text,
  p_user_agent text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_share public.shares%rowtype;
  v_status text;
  v_kind text;
  v_items jsonb;
begin
  if p_token is null or char_length(p_token) < 20 then
    return jsonb_build_object('status', 'not_found');
  end if;

  select *
    into v_share
  from public.shares
  where token_hash = encode(digest(p_token, 'sha256'), 'hex')
  limit 1;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  if v_share.revoked_at is not null or v_share.status = 'revoked' then
    v_status := 'revoked';
    v_kind := 'revoked_hit';
  elsif v_share.expires_at <= now() or v_share.status = 'expired' then
    v_status := 'expired';
    v_kind := 'expired_hit';
  else
    v_status := 'active';
    v_kind := 'opened';
  end if;

  insert into public.share_access_events (share_id, kind, user_agent)
  values (v_share.id, v_kind, left(p_user_agent, 500));

  if v_status <> 'active' then
    return jsonb_build_object(
      'status', v_status,
      'recipientName', v_share.recipient_name,
      'purpose', v_share.purpose,
      'expiresAt', v_share.expires_at
    );
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'label', si.label,
        'itemType', si.item_type,
        'sensitive', si.sensitive
      )
      order by si.created_at asc
    ),
    '[]'::jsonb
  )
    into v_items
  from public.share_items si
  where si.share_id = v_share.id;

  return jsonb_build_object(
    'status', 'active',
    'recipientName', v_share.recipient_name,
    'purpose', v_share.purpose,
    'message', v_share.message,
    'allowDownload', v_share.allow_download,
    'expiresAt', v_share.expires_at,
    'items', v_items
  );
end;
$$;

grant execute on function public.get_share_preview(text, text) to anon, authenticated;
