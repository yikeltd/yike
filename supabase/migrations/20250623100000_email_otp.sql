-- Email OTP for signup/login verification (6-digit code via Resend)

CREATE TABLE IF NOT EXISTS email_otp_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  otp_hash TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS email_otp_email_idx ON email_otp_requests (LOWER(email), created_at DESC);

ALTER TABLE email_otp_requests ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION yike_email_otp_last_sent_at(p_token text, p_email text)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last timestamptz;
BEGIN
  PERFORM yike_assert_otp_token(p_token);
  SELECT r.last_sent_at INTO v_last
  FROM email_otp_requests r
  WHERE LOWER(r.email) = LOWER(TRIM(p_email))
    AND r.status IN ('pending', 'sent')
  ORDER BY r.created_at DESC
  LIMIT 1;
  RETURN v_last;
END;
$$;

CREATE OR REPLACE FUNCTION yike_email_otp_insert_pending(
  p_token text,
  p_email text,
  p_otp_hash text,
  p_expires_at timestamptz,
  p_user_id uuid,
  p_last_sent_at timestamptz
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
  INSERT INTO email_otp_requests (
    email, user_id, otp_hash, expires_at, attempts, status, last_sent_at
  ) VALUES (
    LOWER(TRIM(p_email)), p_user_id, p_otp_hash, p_expires_at, 0, 'pending', p_last_sent_at
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION yike_email_otp_latest_verifiable(p_token text, p_email text)
RETURNS TABLE (
  id uuid,
  otp_hash text,
  expires_at timestamptz,
  verified boolean,
  attempts int,
  last_sent_at timestamptz,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM yike_assert_otp_token(p_token);
  RETURN QUERY
  SELECT
    r.id,
    r.otp_hash,
    r.expires_at,
    r.verified,
    r.attempts,
    r.last_sent_at,
    r.status
  FROM email_otp_requests r
  WHERE LOWER(r.email) = LOWER(TRIM(p_email))
    AND r.verified = FALSE
    AND r.status IN ('pending', 'sent')
  ORDER BY r.created_at DESC
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION yike_email_otp_mark_sent(p_token text, p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM yike_assert_otp_token(p_token);
  UPDATE email_otp_requests SET status = 'sent' WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION yike_email_otp_increment_attempts(p_token text, p_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempts int;
BEGIN
  PERFORM yike_assert_otp_token(p_token);
  UPDATE email_otp_requests
  SET attempts = attempts + 1
  WHERE id = p_id
  RETURNING attempts INTO v_attempts;
  RETURN v_attempts;
END;
$$;

CREATE OR REPLACE FUNCTION yike_email_otp_verify_success(p_token text, p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM yike_assert_otp_token(p_token);
  UPDATE email_otp_requests
  SET verified = TRUE, status = 'verified', verified_at = NOW()
  WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION yike_email_confirm_user(p_token text, p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  PERFORM yike_assert_otp_token(p_token);
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE LOWER(email) = LOWER(TRIM(p_email))
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
  WHERE id = v_user_id;

  UPDATE profiles
  SET email_verified = TRUE
  WHERE id = v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION yike_email_otp_last_sent_at(text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION yike_email_otp_insert_pending(text, text, text, timestamptz, uuid, timestamptz) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION yike_email_otp_latest_verifiable(text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION yike_email_otp_mark_sent(text, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION yike_email_otp_increment_attempts(text, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION yike_email_otp_verify_success(text, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION yike_email_confirm_user(text, text) TO anon, authenticated, service_role;
