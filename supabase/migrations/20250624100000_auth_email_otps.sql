-- Yike-owned email OTP (Resend) — no Supabase default confirmation emails

CREATE TABLE IF NOT EXISTS auth_email_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'signup',
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_hash TEXT,
  user_agent_hash TEXT
);

CREATE INDEX IF NOT EXISTS auth_email_otps_lookup_idx
  ON auth_email_otps (LOWER(email), purpose, created_at DESC);

CREATE INDEX IF NOT EXISTS auth_email_otps_ip_hour_idx
  ON auth_email_otps (ip_hash, created_at DESC)
  WHERE ip_hash IS NOT NULL;

ALTER TABLE auth_email_otps ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS auth_signup_pending (
  email TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  pin_hash TEXT NOT NULL,
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE auth_signup_pending ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION yike_email_registered(p_token text, p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM yike_assert_otp_token(p_token);
  RETURN EXISTS (
    SELECT 1 FROM auth.users WHERE LOWER(email) = LOWER(TRIM(p_email))
  );
END;
$$;

CREATE OR REPLACE FUNCTION yike_signup_pending_upsert(
  p_token text,
  p_email text,
  p_username text,
  p_full_name text,
  p_phone text,
  p_pin_hash text,
  p_phone_verified boolean,
  p_expires_at timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM yike_assert_otp_token(p_token);
  INSERT INTO auth_signup_pending (
    email, username, full_name, phone, pin_hash, phone_verified, expires_at
  ) VALUES (
    LOWER(TRIM(p_email)),
    LOWER(TRIM(p_username)),
    TRIM(p_full_name),
    NULLIF(TRIM(p_phone), ''),
    p_pin_hash,
    COALESCE(p_phone_verified, FALSE),
    p_expires_at
  )
  ON CONFLICT (email) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    pin_hash = EXCLUDED.pin_hash,
    phone_verified = EXCLUDED.phone_verified,
    expires_at = EXCLUDED.expires_at,
    created_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION yike_signup_pending_get(p_token text, p_email text)
RETURNS TABLE (
  email text,
  username text,
  full_name text,
  phone text,
  pin_hash text,
  phone_verified boolean,
  expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM yike_assert_otp_token(p_token);
  RETURN QUERY
  SELECT
    s.email,
    s.username,
    s.full_name,
    s.phone,
    s.pin_hash,
    s.phone_verified,
    s.expires_at
  FROM auth_signup_pending s
  WHERE s.email = LOWER(TRIM(p_email));
END;
$$;

CREATE OR REPLACE FUNCTION yike_signup_pending_delete(p_token text, p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM yike_assert_otp_token(p_token);
  DELETE FROM auth_signup_pending WHERE email = LOWER(TRIM(p_email));
END;
$$;

CREATE OR REPLACE FUNCTION yike_auth_otp_invalidate_active(
  p_token text,
  p_email text,
  p_purpose text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM yike_assert_otp_token(p_token);
  UPDATE auth_email_otps
  SET consumed_at = NOW()
  WHERE LOWER(email) = LOWER(TRIM(p_email))
    AND purpose = TRIM(p_purpose)
    AND consumed_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION yike_auth_otp_last_sent_at(
  p_token text,
  p_email text,
  p_purpose text
)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last timestamptz;
BEGIN
  PERFORM yike_assert_otp_token(p_token);
  SELECT o.created_at INTO v_last
  FROM auth_email_otps o
  WHERE LOWER(o.email) = LOWER(TRIM(p_email))
    AND o.purpose = TRIM(p_purpose)
  ORDER BY o.created_at DESC
  LIMIT 1;
  RETURN v_last;
END;
$$;

CREATE OR REPLACE FUNCTION yike_auth_otp_send_count_hour(
  p_token text,
  p_email text,
  p_purpose text
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  PERFORM yike_assert_otp_token(p_token);
  SELECT COUNT(*)::int INTO v_count
  FROM auth_email_otps o
  WHERE LOWER(o.email) = LOWER(TRIM(p_email))
    AND o.purpose = TRIM(p_purpose)
    AND o.created_at > NOW() - INTERVAL '1 hour';
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION yike_auth_otp_ip_send_count_hour(
  p_token text,
  p_ip_hash text
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  PERFORM yike_assert_otp_token(p_token);
  IF p_ip_hash IS NULL OR TRIM(p_ip_hash) = '' THEN
    RETURN 0;
  END IF;
  SELECT COUNT(*)::int INTO v_count
  FROM auth_email_otps o
  WHERE o.ip_hash = TRIM(p_ip_hash)
    AND o.created_at > NOW() - INTERVAL '1 hour';
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION yike_auth_otp_insert(
  p_token text,
  p_email text,
  p_purpose text,
  p_otp_hash text,
  p_expires_at timestamptz,
  p_ip_hash text,
  p_user_agent_hash text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  PERFORM yike_assert_otp_token(p_token);
  INSERT INTO auth_email_otps (
    email, otp_hash, purpose, expires_at, ip_hash, user_agent_hash
  ) VALUES (
    LOWER(TRIM(p_email)),
    p_otp_hash,
    TRIM(p_purpose),
    p_expires_at,
    NULLIF(TRIM(p_ip_hash), ''),
    NULLIF(TRIM(p_user_agent_hash), '')
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION yike_auth_otp_latest_active(
  p_token text,
  p_email text,
  p_purpose text
)
RETURNS TABLE (
  id uuid,
  otp_hash text,
  expires_at timestamptz,
  attempts int,
  max_attempts int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM yike_assert_otp_token(p_token);
  RETURN QUERY
  SELECT
    o.id,
    o.otp_hash,
    o.expires_at,
    o.attempts,
    o.max_attempts
  FROM auth_email_otps o
  WHERE LOWER(o.email) = LOWER(TRIM(p_email))
    AND o.purpose = TRIM(p_purpose)
    AND o.consumed_at IS NULL
  ORDER BY o.created_at DESC
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION yike_auth_otp_increment_attempts(p_token text, p_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempts int;
BEGIN
  PERFORM yike_assert_otp_token(p_token);
  UPDATE auth_email_otps
  SET attempts = attempts + 1
  WHERE id = p_id
  RETURNING attempts INTO v_attempts;
  RETURN v_attempts;
END;
$$;

CREATE OR REPLACE FUNCTION yike_auth_otp_consume(p_token text, p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM yike_assert_otp_token(p_token);
  UPDATE auth_email_otps
  SET consumed_at = NOW()
  WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION yike_email_registered(text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION yike_signup_pending_upsert(text, text, text, text, text, text, boolean, timestamptz) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION yike_signup_pending_get(text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION yike_signup_pending_delete(text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION yike_auth_otp_invalidate_active(text, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION yike_auth_otp_last_sent_at(text, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION yike_auth_otp_send_count_hour(text, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION yike_auth_otp_ip_send_count_hour(text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION yike_auth_otp_insert(text, text, text, text, timestamptz, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION yike_auth_otp_latest_active(text, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION yike_auth_otp_increment_attempts(text, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION yike_auth_otp_consume(text, uuid) TO anon, authenticated, service_role;
