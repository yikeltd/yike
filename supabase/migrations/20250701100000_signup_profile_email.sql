-- Ensure signup completion sets profile email from auth

CREATE OR REPLACE FUNCTION yike_complete_signup(
  p_token text,
  p_user_id uuid,
  p_username text,
  p_pin_hash text,
  p_phone text,
  p_full_name text,
  p_phone_verified boolean DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  PERFORM yike_assert_otp_token(p_token);

  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;

  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE LOWER(username) = LOWER(NULLIF(TRIM(p_username), ''))
      AND id <> p_user_id
  ) THEN
    RAISE EXCEPTION 'username_taken';
  END IF;

  UPDATE profiles
  SET
    full_name = NULLIF(TRIM(p_full_name), ''),
    username = NULLIF(TRIM(p_username), ''),
    phone = NULLIF(TRIM(p_phone), ''),
    whatsapp = NULLIF(TRIM(p_phone), ''),
    pin_hash = p_pin_hash,
    phone_verified = COALESCE(p_phone_verified, true),
    email = COALESCE(v_email, email),
    email_verified = TRUE,
    role = 'user',
    verification_status = 'not_started',
    is_banned = FALSE
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO profiles (
      id, full_name, username, phone, whatsapp, pin_hash, email,
      phone_verified, email_verified, role, verification_status, is_banned
    ) VALUES (
      p_user_id,
      NULLIF(TRIM(p_full_name), ''),
      NULLIF(TRIM(p_username), ''),
      NULLIF(TRIM(p_phone), ''),
      NULLIF(TRIM(p_phone), ''),
      p_pin_hash,
      v_email,
      COALESCE(p_phone_verified, true),
      TRUE,
      'user',
      'not_started',
      FALSE
    );
  END IF;
END;
$$;
