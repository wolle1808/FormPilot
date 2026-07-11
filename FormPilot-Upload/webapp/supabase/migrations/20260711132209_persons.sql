-- ─────────────────────────────────────────────────────────────────────────────
-- persons: natürliche Personen im Haushalt (inkl. „Ich“ und verwaltete Angehörige)
-- Referenz: architecture/DATA_MODEL.md §3
-- ─────────────────────────────────────────────────────────────────────────────

create table public.persons (
  id             uuid primary key default gen_random_uuid(),
  owner_user_id  uuid not null references auth.users (id) on delete cascade,
  display_name   text not null check (char_length(display_name) between 1 and 120),
  relation       text not null default 'self'
                 check (relation in ('self','child','parent','grandparent','partner','other')),
  notes          text check (notes is null or char_length(notes) <= 2000),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.persons is
  'Personen, deren Unterlagen ein Konto verwaltet. Mandats-Nachweise (Vollmachten) folgen in einer späteren Phase (mandates).';

create index persons_owner_idx on public.persons (owner_user_id);

-- Genau eine „Ich“-Person pro Konto
create unique index persons_one_self_per_owner
  on public.persons (owner_user_id)
  where relation = 'self';

create trigger persons_set_updated_at
  before update on public.persons
  for each row execute function public.set_updated_at();

-- Row Level Security: strikt eigentümerbasiert.
alter table public.persons enable row level security;

create policy "persons_select_own"
  on public.persons for select
  to authenticated
  using (owner_user_id = (select auth.uid()));

create policy "persons_insert_own"
  on public.persons for insert
  to authenticated
  with check (owner_user_id = (select auth.uid()));

create policy "persons_update_own"
  on public.persons for update
  to authenticated
  using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));

create policy "persons_delete_own"
  on public.persons for delete
  to authenticated
  using (owner_user_id = (select auth.uid()));

revoke all on public.persons from anon;
grant select, insert, update, delete on public.persons to authenticated;

-- Automatik erweitern: Registrierung legt Profil UND „Ich“-Person an.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  v_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'Ich');

  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));

  insert into public.persons (owner_user_id, display_name, relation)
  values (new.id, v_name, 'self');

  return new;
end;
$$;
