-- Fix pin_hash exposure: table-level SELECT overrides column REVOKE.
-- Revoke table SELECT/UPDATE/INSERT from anon/authenticated, then re-grant
-- every column except pin_hash / admin_pin_hash.
-- Project: hlpojfurfldvcxfxhveg

DO $$
DECLARE
  select_cols text;
  update_cols text;
  insert_cols text;
BEGIN
  SELECT string_agg(quote_ident(c.column_name), ', ' ORDER BY c.ordinal_position)
  INTO select_cols
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'profiles'
    AND c.column_name NOT IN ('pin_hash', 'admin_pin_hash');

  IF select_cols IS NULL OR length(select_cols) < 3 THEN
    RAISE EXCEPTION 'profiles column grant list empty — aborting';
  END IF;

  -- Same non-secret columns for UPDATE/INSERT grants
  update_cols := select_cols;
  insert_cols := select_cols;

  REVOKE SELECT ON TABLE public.profiles FROM anon, authenticated;
  REVOKE UPDATE ON TABLE public.profiles FROM anon, authenticated;
  REVOKE INSERT ON TABLE public.profiles FROM anon, authenticated;

  EXECUTE format(
    'GRANT SELECT (%s) ON TABLE public.profiles TO anon, authenticated',
    select_cols
  );
  EXECUTE format(
    'GRANT UPDATE (%s) ON TABLE public.profiles TO authenticated',
    update_cols
  );
  -- Authenticated insert used by some profile-create paths; anon should not insert.
  EXECUTE format(
    'GRANT INSERT (%s) ON TABLE public.profiles TO authenticated',
    insert_cols
  );

  -- Keep references if previously granted (harmless for API)
  GRANT REFERENCES ON TABLE public.profiles TO anon, authenticated;
END $$;

-- Server + SECURITY DEFINER owners retain full access
GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER, TRUNCATE
  ON TABLE public.profiles TO service_role, postgres;

COMMENT ON COLUMN public.profiles.pin_hash IS
  'Consumer PIN hash — not granted to anon/authenticated; use RPC or service_role.';
COMMENT ON COLUMN public.profiles.admin_pin_hash IS
  'Staff admin PIN hash — not granted to anon/authenticated; use service_role.';
