-- ─────────────────────────────────────────────────────────────────────────────
-- Dokumentensafe: private Storage-Objekte + fachliche Metadaten
-- Referenz: architecture/DATA_MODEL.md §4, SECURITY_MODEL.md §7
-- ─────────────────────────────────────────────────────────────────────────────

do $$
begin
  create type public.document_category as enum (
    'identity',
    'income',
    'insurance',
    'care',
    'education',
    'work',
    'housing',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.document_status as enum ('ok', 'expiring', 'expired');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.av_scan_status as enum ('pending', 'clean', 'infected', 'error');
exception
  when duplicate_object then null;
end $$;

-- Privater Bucket: Browser/Server dürfen nur in ihren eigenen Pfad schreiben.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table public.files (
  id                  uuid primary key default gen_random_uuid(),
  owner_user_id       uuid not null references auth.users (id) on delete cascade,
  storage_bucket      text not null default 'documents',
  storage_key         text not null unique,
  original_filename   text not null check (char_length(original_filename) between 1 and 240),
  size_bytes          bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  mime_type           text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  sha256              text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  enc_key_id          text,
  enc_algo            text,
  av_scan_status      public.av_scan_status not null default 'pending',
  av_scanned_at       timestamptz,
  uploaded_by_user_id uuid not null references auth.users (id) on delete cascade,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.files is
  'Physische Objekte im privaten Storage. App-seitige Datei-Verschlüsselung und Virenscan werden über enc_* und av_scan_status vorbereitet.';

create index files_owner_idx on public.files (owner_user_id);
create index files_storage_key_idx on public.files (storage_bucket, storage_key);

create trigger files_set_updated_at
  before update on public.files
  for each row execute function public.set_updated_at();

create table public.documents (
  id                          uuid primary key default gen_random_uuid(),
  owner_user_id               uuid not null references auth.users (id) on delete cascade,
  person_id                   uuid not null references public.persons (id) on delete restrict,
  title                       text not null check (char_length(title) between 2 and 160),
  category                    public.document_category not null,
  valid_until                 date,
  sensitive                   boolean not null default true,
  status                      public.document_status not null default 'ok',
  last_shared_recipient_cache text,
  deleted_at                  timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

comment on table public.documents is
  'Fachliches Dokument im Safe. Versionen und physische Dateien liegen in document_versions/files.';

create index documents_owner_idx on public.documents (owner_user_id, deleted_at);
create index documents_person_idx on public.documents (person_id);
create index documents_valid_until_idx on public.documents (valid_until);

create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

create table public.document_versions (
  id                 uuid primary key default gen_random_uuid(),
  document_id        uuid not null references public.documents (id) on delete cascade,
  version_no         integer not null check (version_no >= 1),
  file_id            uuid not null references public.files (id) on delete restrict,
  note               text check (note is null or char_length(note) <= 1000),
  created_by_user_id uuid not null references auth.users (id) on delete cascade,
  superseded_at      timestamptz,
  created_at         timestamptz not null default now()
);

comment on table public.document_versions is
  'Versionen eines fachlichen Dokuments. Jede Version zeigt auf genau eine Datei.';

create unique index document_versions_document_version_no_idx
  on public.document_versions (document_id, version_no);
create index document_versions_file_idx on public.document_versions (file_id);

-- Row Level Security: App-Rolle sieht ausschließlich eigene Safe-Daten.
alter table public.files enable row level security;
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;

create policy "files_select_own"
  on public.files for select
  to authenticated
  using (owner_user_id = (select auth.uid()));

create policy "files_insert_own"
  on public.files for insert
  to authenticated
  with check (
    owner_user_id = (select auth.uid())
    and uploaded_by_user_id = (select auth.uid())
    and storage_bucket = 'documents'
    and split_part(storage_key, '/', 1) = (select auth.uid())::text
  );

create policy "files_delete_own"
  on public.files for delete
  to authenticated
  using (owner_user_id = (select auth.uid()));

create policy "documents_select_own"
  on public.documents for select
  to authenticated
  using (owner_user_id = (select auth.uid()));

create policy "documents_insert_own"
  on public.documents for insert
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

create policy "documents_update_own"
  on public.documents for update
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

create policy "document_versions_select_own"
  on public.document_versions for select
  to authenticated
  using (
    exists (
      select 1
      from public.documents d
      where d.id = document_id
        and d.owner_user_id = (select auth.uid())
    )
  );

create policy "document_versions_insert_own"
  on public.document_versions for insert
  to authenticated
  with check (
    created_by_user_id = (select auth.uid())
    and exists (
      select 1
      from public.documents d
      where d.id = document_id
        and d.owner_user_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.files f
      where f.id = file_id
        and f.owner_user_id = (select auth.uid())
    )
  );

revoke all on public.files from anon;
revoke all on public.documents from anon;
revoke all on public.document_versions from anon;

grant select, insert, delete on public.files to authenticated;
grant select, insert, update on public.documents to authenticated;
grant select, insert on public.document_versions to authenticated;

-- Storage-Objekte: erster Pfadteil muss immer die eigene auth.uid() sein.
create policy "storage_documents_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "storage_documents_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "storage_documents_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
