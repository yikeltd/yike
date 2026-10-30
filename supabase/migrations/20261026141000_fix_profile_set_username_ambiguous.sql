-- Fix: RETURNS TABLE (username ...) made unqualified "username" ambiguous in EXISTS.

CREATE OR REPLACE FUNCTION public.yike_profile_set_username(
  p_user_id uuid,
  p_username text,
  p_allow_change boolean DEFAULT false
)
RETURNS TABLE (username text, username_updated_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current text;
  v_updated timestamptz;
  v_normalized text;
  v_last timestamptz;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'invalid_user_id';
  END IF;

  v_normalized := NULLIF(LOWER(TRIM(p_username)), '');
  IF v_normalized IS NULL OR char_length(v_normalized) < 3 OR char_length(v_normalized) > 24 THEN
    RAISE EXCEPTION 'invalid_username_format';
  END IF;

  SELECT pr.username, pr.username_updated_at
  INTO v_current, v_last
  FROM public.profiles pr
  WHERE pr.id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  IF v_current IS NOT NULL AND LOWER(TRIM(v_current)) = v_normalized THEN
    RETURN QUERY SELECT v_normalized, v_last;
    RETURN;
  END IF;

  IF v_current IS NOT NULL AND NOT COALESCE(p_allow_change, false) THEN
    RAISE EXCEPTION 'username_already_set';
  END IF;

  IF v_current IS NOT NULL AND v_last IS NOT NULL AND COALESCE(p_allow_change, false) THEN
    IF v_last > NOW() - INTERVAL '14 days' THEN
      RAISE EXCEPTION 'username_change_rate_limited';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles pr_taken
    WHERE LOWER(pr_taken.username) = v_normalized AND pr_taken.id <> p_user_id
  ) THEN
    RAISE EXCEPTION 'username_taken';
  END IF;

  PERFORM set_config('yike.allow_profile_username_change', '1', true);

  UPDATE public.profiles pr_upd
  SET username = v_normalized, username_updated_at = NOW()
  WHERE pr_upd.id = p_user_id
  RETURNING pr_upd.username, pr_upd.username_updated_at INTO v_current, v_updated;

  RETURN QUERY SELECT v_current, v_updated;
END;
$$;

REVOKE ALL ON FUNCTION public.yike_profile_set_username(uuid, text, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.yike_profile_set_username(uuid, text, boolean) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.yike_profile_set_username(uuid, text, boolean) TO service_role;
