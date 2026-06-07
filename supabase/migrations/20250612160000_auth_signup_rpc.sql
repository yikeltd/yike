-- Signup completion via server token (no service-role key required on Vercel)

CREATE OR REPLACE FUNCTION yike_username_available(p_token text, p_username text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM yike_assert_otp_token(p_token);
  RETURN NOT EXISTS (
    SELECT 1 FROM profiles WHERE LOWER(username) = LOWER(NULLIF(TRIM(p_username), ''))
  );
END;
$$;

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
BEGIN
  PERFORM yike_assert_otp_token(p_token);

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
    email_verified = FALSE,
    role = 'user',
    verification_status = 'not_started',
    is_banned = FALSE
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO profiles (
      id, full_name, username, phone, whatsapp, pin_hash,
      phone_verified, email_verified, role, verification_status, is_banned
    ) VALUES (
      p_user_id,
      NULLIF(TRIM(p_full_name), ''),
      NULLIF(TRIM(p_username), ''),
      NULLIF(TRIM(p_phone), ''),
      NULLIF(TRIM(p_phone), ''),
      p_pin_hash,
      COALESCE(p_phone_verified, true),
      FALSE,
      'user',
      'not_started',
      FALSE
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION yike_auth_confirm_reviewer(p_token text, p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM yike_assert_otp_token(p_token);
  IF LOWER(TRIM(p_email)) NOT IN ('reviewer@yike.ng', 'adminreview@yike.ng') THEN
    RAISE EXCEPTION 'not_reviewer';
  END IF;
  UPDATE auth.users
  SET
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    confirmed_at = COALESCE(confirmed_at, NOW())
  WHERE LOWER(email) = LOWER(TRIM(p_email));
END;
$$;

GRANT EXECUTE ON FUNCTION yike_username_available(text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION yike_complete_signup(text, uuid, text, text, text, text, boolean) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION yike_auth_confirm_reviewer(text, text) TO anon, authenticated, service_role;
