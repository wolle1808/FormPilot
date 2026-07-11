-- ─────────────────────────────────────────────────────────────────────────────
-- profiles: App-Profil je Konto (1:1 zu auth.users)
-- Referenz: architecture/DATA_MODEL.md §2
-- ─────────────────────────────────────────────────────────────────────────────

-- Gemeinsame updated_at-Pflege für alle Tabellen
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  locale      text not null default 'de',
  font_scale  integer not null default 100 check (font_scale between 100 and 120),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'App-Profil je Konto. Enthält keine sensiblen Fachdaten — die liegen an persons/person_fields (spätere Phase).';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Row Level Security: Jeder sieht und ändert ausschließlich das eigene Profil.
alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = (select auth.uid()));

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Kein DELETE-Policy: Profile verschwinden nur über die Konto-Löschung (Cascade).

-- Zugriffsrechte: anon hat nichts auf profiles verloren.
revoke all on public.profiles from anon;
grant select, insert, update on public.profiles to authenticated;

-- Automatik: Bei Registrierung entsteht das Profil serverseitig (kein Client-Insert nötig).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
