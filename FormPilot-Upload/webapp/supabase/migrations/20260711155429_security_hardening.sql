-- ─────────────────────────────────────────────────────────────────────────────
-- Sicherheits-Härtung: search_path fixieren + interne SECURITY DEFINER-Funktionen
-- aus der öffentlichen API (PostgREST/RPC) nehmen.
-- Behebt Supabase-Linter 0011 (function_search_path_mutable) sowie 0028/0029 für
-- die NICHT öffentlich gedachten Funktionen. Die Empfänger-RPCs
-- (get_share_preview/unlock_share/get_share_download) bleiben bewusst anon-aufrufbar
-- — sie prüfen Token, Widerruf, Ablauf, Passwort-Proof und Rate-Limit selbst.
-- Referenz: SECURITY.md, RLS_CONCEPT.md
-- ─────────────────────────────────────────────────────────────────────────────

-- 0011: search_path der gemeinsamen Trigger-Funktion fixieren (nutzt nur now()).
alter function public.set_updated_at() set search_path = '';

-- handle_new_user ist ausschließlich ein auth.users-Trigger — kein API-Aufruf nötig.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- hash_share_password ist ein interner Helfer; anon soll ihn nicht aufrufen können.
revoke execute on function public.hash_share_password(text) from public, anon;
