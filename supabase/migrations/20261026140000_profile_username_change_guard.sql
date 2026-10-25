-- Block direct client username changes; allow only via service_role RPC (server API).

CREATE OR REPLACE FUNCTION public.yike_profile_guard_username_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.username IS NOT DISTINCT FROM OLD.username THEN
    RETURN NEW;
  END IF;

  IF current_setting('yike.allow_profile_username_change', true) IS DISTINCT FROM '1' THEN
    RAISE EXCEPTION 'username_change_forbidden';
  END IF;

  NEW.username := NULLIF(LOWER(TRIM(NEW.username)), '');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS yike_profile_username_guard ON public.profiles;
CREATE TRIGGER yike_profile_username_guard
  BEFORE UPDATE OF username ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.yike_profile_guard_username_update();

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
    SELECT 1 FROM public.profiles
    WHERE LOWER(username) = v_normalized AND id <> p_user_id
  ) THEN
    RAISE EXCEPTION 'username_taken';
  END IF;

  PERFORM set_config('yike.allow_profile_username_change', '1', true);

  UPDATE public.profiles
  SET username = v_normalized, username_updated_at = NOW()
  WHERE id = p_user_id
  RETURNING profiles.username, profiles.username_updated_at INTO v_current, v_updated;

  RETURN QUERY SELECT v_current, v_updated;
END;
$$;

REVOKE ALL ON FUNCTION public.yike_profile_set_username(uuid, text, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.yike_profile_set_username(uuid, text, boolean) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.yike_profile_set_username(uuid, text, boolean) TO service_role;
