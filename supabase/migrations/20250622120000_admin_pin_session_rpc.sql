-- Admin PIN operations via authenticated session (no service-role key required)

CREATE OR REPLACE FUNCTION yike_admin_reset_profile_pin(
  p_target_id uuid,
  p_pin_type text,
  p_pin_hash text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_role text;
  v_banned boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
      AND is_banned = FALSE
  ) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF p_pin_hash IS NULL OR length(p_pin_hash) < 10 THEN
    RAISE EXCEPTION 'invalid_pin_hash';
  END IF;

  SELECT role, is_banned
  INTO v_target_role, v_banned
  FROM profiles
  WHERE id = p_target_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  IF v_banned THEN
    RAISE EXCEPTION 'profile_banned';
  END IF;

  IF p_pin_type = 'admin' THEN
    IF v_target_role NOT IN (
      'super_admin', 'admin', 'support', 'tech', 'content', 'careers', 'moderator'
    ) THEN
      RAISE EXCEPTION 'admin_pin_staff_only';
    END IF;
    UPDATE profiles SET admin_pin_hash = p_pin_hash WHERE id = p_target_id;
  ELSIF p_pin_type = 'login' THEN
    UPDATE profiles SET pin_hash = p_pin_hash WHERE id = p_target_id;
  ELSE
    RAISE EXCEPTION 'invalid_pin_type';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION yike_admin_reset_profile_pin(uuid, text, text) TO authenticated;
