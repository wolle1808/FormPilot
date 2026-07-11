-- ─────────────────────────────────────────────────────────────────────────────
-- Freigabe-Auslieferung: Passwort, Rate-Limit, Download-Metadaten
-- Referenz: SECURITY_MODEL.md §7-§8
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pgcrypto;

create or replace function public.hash_share_password(p_password text)
returns text
language sql
security definer
set search_path = public, extensions
as $$
  select case
    when p_password is null or char_length(p_password) < 8 then null
    else crypt(p_password, gen_salt('bf', 10))
  end;
$$;

grant execute on function public.hash_share_password(text) to authenticated;

drop function if exists public.get_share_preview(text, text);

create or replace function public.get_share_preview(
  p_token text,
  p_user_agent text default null,
  p_unlock_proof text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_share public.shares%rowtype;
  v_status text;
  v_kind text;
  v_items jsonb;
  v_expected_proof text;
  v_open_count integer;
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

  if v_status <> 'active' then
    insert into public.share_access_events (share_id, kind, user_agent)
    values (v_share.id, v_kind, left(p_user_agent, 500));

    return jsonb_build_object(
      'status', v_status,
      'recipientName', v_share.recipient_name,
      'purpose', v_share.purpose,
      'expiresAt', v_share.expires_at
    );
  end if;

  if v_share.password_hash is not null then
    select count(*)
      into v_open_count
    from public.share_access_events
    where share_id = v_share.id
      and kind in ('password_required', 'opened')
      and occurred_at > now() - interval '15 minutes';

    if v_open_count >= 60 then
      insert into public.share_access_events (share_id, kind, user_agent)
      values (v_share.id, 'rate_limited', left(p_user_agent, 500));
      return jsonb_build_object('status', 'rate_limited');
    end if;

    v_expected_proof := encode(digest(p_token || v_share.password_hash, 'sha256'), 'hex');
    if coalesce(p_unlock_proof, '') <> v_expected_proof then
      insert into public.share_access_events (share_id, kind, user_agent)
      values (v_share.id, 'password_required', left(p_user_agent, 500));

      return jsonb_build_object(
        'status', 'password_required',
        'expiresAt', v_share.expires_at
      );
    end if;
  end if;

  select count(*)
    into v_open_count
  from public.share_access_events
  where share_id = v_share.id
    and kind = 'opened'
    and occurred_at > now() - interval '15 minutes';

  if v_open_count >= 60 then
    insert into public.share_access_events (share_id, kind, user_agent)
    values (v_share.id, 'rate_limited', left(p_user_agent, 500));
    return jsonb_build_object('status', 'rate_limited');
  end if;

  insert into public.share_access_events (share_id, kind, user_agent)
  values (v_share.id, v_kind, left(p_user_agent, 500));

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', si.id,
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

grant execute on function public.get_share_preview(text, text, text) to anon, authenticated;

create or replace function public.unlock_share(
  p_token text,
  p_password text,
  p_user_agent text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_share public.shares%rowtype;
  v_failed_count integer;
  v_unlock_proof text;
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
    insert into public.share_access_events (share_id, kind, user_agent)
    values (v_share.id, 'revoked_hit', left(p_user_agent, 500));
    return jsonb_build_object('status', 'revoked');
  end if;

  if v_share.expires_at <= now() or v_share.status = 'expired' then
    insert into public.share_access_events (share_id, kind, user_agent)
    values (v_share.id, 'expired_hit', left(p_user_agent, 500));
    return jsonb_build_object('status', 'expired');
  end if;

  if v_share.password_hash is null then
    return jsonb_build_object('status', 'active');
  end if;

  select count(*)
    into v_failed_count
  from public.share_access_events
  where share_id = v_share.id
    and kind = 'password_failed'
    and occurred_at > now() - interval '15 minutes';

  if v_failed_count >= 5 then
    insert into public.share_access_events (share_id, kind, user_agent)
    values (v_share.id, 'rate_limited', left(p_user_agent, 500));
    return jsonb_build_object('status', 'rate_limited');
  end if;

  if p_password is null or crypt(p_password, v_share.password_hash) <> v_share.password_hash then
    insert into public.share_access_events (share_id, kind, user_agent)
    values (v_share.id, 'password_failed', left(p_user_agent, 500));
    return jsonb_build_object('status', 'password_invalid');
  end if;

  v_unlock_proof := encode(digest(p_token || v_share.password_hash, 'sha256'), 'hex');

  insert into public.share_access_events (share_id, kind, user_agent)
  values (v_share.id, 'password_unlocked', left(p_user_agent, 500));

  return jsonb_build_object(
    'status', 'active',
    'unlockProof', v_unlock_proof,
    'expiresAt', v_share.expires_at
  );
end;
$$;

grant execute on function public.unlock_share(text, text, text) to anon, authenticated;

create or replace function public.get_share_download(
  p_token text,
  p_item_id uuid,
  p_user_agent text default null,
  p_unlock_proof text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_share public.shares%rowtype;
  v_expected_proof text;
  v_download_count integer;
  v_file record;
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
    insert into public.share_access_events (share_id, kind, user_agent)
    values (v_share.id, 'revoked_hit', left(p_user_agent, 500));
    return jsonb_build_object('status', 'revoked');
  end if;

  if v_share.expires_at <= now() or v_share.status = 'expired' then
    insert into public.share_access_events (share_id, kind, user_agent)
    values (v_share.id, 'expired_hit', left(p_user_agent, 500));
    return jsonb_build_object('status', 'expired');
  end if;

  if not v_share.allow_download then
    return jsonb_build_object('status', 'download_disabled');
  end if;

  if v_share.password_hash is not null then
    v_expected_proof := encode(digest(p_token || v_share.password_hash, 'sha256'), 'hex');
    if coalesce(p_unlock_proof, '') <> v_expected_proof then
      return jsonb_build_object('status', 'password_required');
    end if;
  end if;

  select count(*)
    into v_download_count
  from public.share_access_events
  where share_id = v_share.id
    and kind = 'downloaded'
    and occurred_at > now() - interval '15 minutes';

  if v_download_count >= 20 then
    insert into public.share_access_events (share_id, kind, user_agent)
    values (v_share.id, 'rate_limited', left(p_user_agent, 500));
    return jsonb_build_object('status', 'rate_limited');
  end if;

  select
    si.id as item_id,
    f.storage_bucket,
    f.storage_key,
    f.original_filename,
    f.mime_type,
    f.size_bytes
    into v_file
  from public.share_items si
  join public.document_versions dv on dv.id = si.document_version_id
  join public.files f on f.id = dv.file_id
  where si.share_id = v_share.id
    and si.id = p_item_id
  limit 1;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  insert into public.share_access_events (share_id, kind, item_id, user_agent)
  values (v_share.id, 'downloaded', p_item_id, left(p_user_agent, 500));

  return jsonb_build_object(
    'status', 'ok',
    'storageBucket', v_file.storage_bucket,
    'storageKey', v_file.storage_key,
    'filename', v_file.original_filename,
    'mimeType', v_file.mime_type,
    'sizeBytes', v_file.size_bytes
  );
end;
$$;

grant execute on function public.get_share_download(text, uuid, text, text) to anon, authenticated;
