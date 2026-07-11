-- ─────────────────────────────────────────────────────────────────────────────
-- Vorgänge: Anforderungen mit Checkliste, Frist und Verlauf
-- Referenz: architecture/DATA_MODEL.md §5
-- ─────────────────────────────────────────────────────────────────────────────

do $$
begin
  create type public.case_status as enum ('open', 'partial', 'sent', 'declined', 'closed');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.case_source as enum ('manual', 'org');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.case_item_type as enum ('data', 'doc');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.case_item_status as enum ('present', 'missing', 'review', 'upload');
exception
  when duplicate_object then null;
end $$;

create table public.cases (
  id                   uuid primary key default gen_random_uuid(),
  owner_user_id        uuid not null references auth.users (id) on delete cascade,
  person_id            uuid not null references public.persons (id) on delete restrict,
  title                text not null check (char_length(title) between 2 and 160),
  recipient_name       text not null check (char_length(recipient_name) between 2 and 160),
  purpose              text not null check (char_length(purpose) between 2 and 500),
  deadline             date,
  status               public.case_status not null default 'open',
  source               public.case_source not null default 'manual',
  request_text         text check (request_text is null or char_length(request_text) <= 4000),
  suggested_share_days integer not null default 14 check (suggested_share_days between 1 and 90),
  deleted_at           timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

comment on table public.cases is
  'Vorgänge bündeln Anforderungen von Empfängern. request_text wird vor echter Produktion verschlüsselt gespeichert.';

create index cases_owner_idx on public.cases (owner_user_id, deleted_at);
create index cases_person_idx on public.cases (person_id);
create index cases_deadline_idx on public.cases (deadline);

create trigger cases_set_updated_at
  before update on public.cases
  for each row execute function public.set_updated_at();

create table public.case_items (
  id                uuid primary key default gen_random_uuid(),
  case_id           uuid not null references public.cases (id) on delete cascade,
  item_type         public.case_item_type not null default 'doc',
  document_category public.document_category,
  document_title    text check (document_title is null or char_length(document_title) <= 160),
  status            public.case_item_status not null default 'missing',
  included          boolean not null default true,
  unusual           boolean not null default false,
  note              text check (note is null or char_length(note) <= 1000),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint case_items_doc_has_requirement
    check (item_type <> 'doc' or document_category is not null or document_title is not null)
);

comment on table public.case_items is
  'Checklistenpunkte eines Vorgangs. Dokument-Posten können gegen den Safe abgeglichen werden.';

create index case_items_case_idx on public.case_items (case_id);
create index case_items_document_category_idx on public.case_items (document_category);

create trigger case_items_set_updated_at
  before update on public.case_items
  for each row execute function public.set_updated_at();

create table public.case_events (
  id          uuid primary key default gen_random_uuid(),
  case_id     uuid not null references public.cases (id) on delete cascade,
  occurred_at timestamptz not null default now(),
  kind        text not null check (char_length(kind) between 2 and 80),
  description text not null check (char_length(description) between 2 and 500)
);

comment on table public.case_events is
  'Verlauf eines Vorgangs in Alltagssprache.';

create index case_events_case_idx on public.case_events (case_id, occurred_at desc);

alter table public.cases enable row level security;
alter table public.case_items enable row level security;
alter table public.case_events enable row level security;

create policy "cases_select_own"
  on public.cases for select
  to authenticated
  using (owner_user_id = (select auth.uid()));

create policy "cases_insert_own"
  on public.cases for insert
  to authenticated
  with check (
    owner_user_id = (select auth.uid())
    and exists (
      select 1
      from public.persons p
      where p.id = person_id
        and p.owner_user_id = (select auth.uid())
    )
  );

create policy "cases_update_own"
  on public.cases for update
  to authenticated
  using (owner_user_id = (select auth.uid()))
  with check (
    owner_user_id = (select auth.uid())
    and exists (
      select 1
      from public.persons p
      where p.id = person_id
        and p.owner_user_id = (select auth.uid())
    )
  );

create policy "case_items_select_own"
  on public.case_items for select
  to authenticated
  using (
    exists (
      select 1
      from public.cases c
      where c.id = case_id
        and c.owner_user_id = (select auth.uid())
    )
  );

create policy "case_items_insert_own"
  on public.case_items for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.cases c
      where c.id = case_id
        and c.owner_user_id = (select auth.uid())
    )
  );

create policy "case_items_update_own"
  on public.case_items for update
  to authenticated
  using (
    exists (
      select 1
      from public.cases c
      where c.id = case_id
        and c.owner_user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.cases c
      where c.id = case_id
        and c.owner_user_id = (select auth.uid())
    )
  );

create policy "case_events_select_own"
  on public.case_events for select
  to authenticated
  using (
    exists (
      select 1
      from public.cases c
      where c.id = case_id
        and c.owner_user_id = (select auth.uid())
    )
  );

create policy "case_events_insert_own"
  on public.case_events for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.cases c
      where c.id = case_id
        and c.owner_user_id = (select auth.uid())
    )
  );

revoke all on public.cases from anon;
revoke all on public.case_items from anon;
revoke all on public.case_events from anon;

grant select, insert, update on public.cases to authenticated;
grant select, insert, update on public.case_items to authenticated;
grant select, insert on public.case_events to authenticated;
