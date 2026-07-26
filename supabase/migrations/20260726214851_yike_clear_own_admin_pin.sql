-- Allow a signed-in super_admin / admin to clear their own admin PIN (recovery).
-- Triggered from Lex settings — Lex session is the gate; admin PIN is step-up only.

CREATE OR REPLACE FUNCTION public.yike_clear_own_admin_pin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
      AND COALESCE(is_banned, false) = false
  ) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  UPDATE public.profiles
  SET admin_pin_hash = NULL
  WHERE id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.yike_clear_own_admin_pin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.yike_clear_own_admin_pin() TO authenticated, service_role;

COMMENT ON FUNCTION public.yike_clear_own_admin_pin() IS
  'Clears the caller''s own admin_pin_hash so they can set a new PIN from Lex without knowing the old one.';

NOTIFY pgrst, 'reload schema';
