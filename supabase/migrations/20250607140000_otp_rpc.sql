-- Server-side OTP RPC (anon key + YIKE_OTP_SERVER_TOKEN) — avoids brittle service-role wiring.

CREATE TABLE IF NOT EXISTS yike_internal_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT INTO yike_internal_config (key, value)
VALUES (
  'otp_server_token',
  'f7a141a77373cee893c932f3515700e3105a874b5ecfea9bf2969f6b6d020a7b'
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

ALTER TABLE yike_internal_config ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION yike_internal_config_value(p_key text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT value FROM yike_internal_config WHERE key = p_key LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION yike_assert_otp_token(p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_token IS NULL OR p_token <> yike_internal_config_value('otp_server_token') THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION yike_otp_latest(p_token text, p_phone text)
RETURNS TABLE (
  id uuid,
  otp_hash text,
  expires_at timestamptz,
  verified boolean,
  attempts int,
  last_sent_at timestamptz,
  channel text,
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
    r.channel,
    r.status
  FROM phone_otp_requests r
  WHERE r.phone = p_phone
  ORDER BY r.created_at DESC
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION yike_otp_insert_pending(
  p_token text,
  p_phone text,
  p_otp_hash text,
  p_expires_at timestamptz,
  p_channel text,
  p_provider text,
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
  INSERT INTO phone_otp_requests (
    phone, otp_hash, expires_at, attempts, channel, provider, status, last_sent_at
  ) VALUES (
    p_phone, p_otp_hash, p_expires_at, 0, p_channel, p_provider, 'pending', p_last_sent_at
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION yike_otp_mark_sent(
  p_token text,
  p_id uuid,
  p_channel text,
  p_provider_reference text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM yike_assert_otp_token(p_token);
  UPDATE phone_otp_requests
  SET
    channel = p_channel,
    status = 'sent',
    provider_reference = p_provider_reference,
    error_message = NULL
  WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION yike_otp_mark_failed(
  p_token text,
  p_id uuid,
  p_error_message text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM yike_assert_otp_token(p_token);
  UPDATE phone_otp_requests
  SET status = 'failed', error_message = p_error_message
  WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION yike_otp_mark_expired(p_token text, p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM yike_assert_otp_token(p_token);
  UPDATE phone_otp_requests SET status = 'expired' WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION yike_otp_increment_attempts(p_token text, p_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempts int;
BEGIN
  PERFORM yike_assert_otp_token(p_token);
  UPDATE phone_otp_requests
  SET attempts = attempts + 1
  WHERE id = p_id
  RETURNING attempts INTO v_attempts;
  RETURN v_attempts;
END;
$$;

CREATE OR REPLACE FUNCTION yike_otp_verify_success(
  p_token text,
  p_id uuid,
  p_verification_token text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM yike_assert_otp_token(p_token);
  UPDATE phone_otp_requests
  SET
    verified = TRUE,
    verification_token = p_verification_token,
    status = 'verified',
    verified_at = NOW()
  WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION yike_otp_find_verified(
  p_token text,
  p_phone text,
  p_verification_token text
)
RETURNS TABLE (id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM yike_assert_otp_token(p_token);
  RETURN QUERY
  SELECT r.id
  FROM phone_otp_requests r
  WHERE r.phone = p_phone
    AND r.verified = TRUE
    AND r.verification_token = p_verification_token
  ORDER BY r.created_at DESC
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION yike_otp_log_event(
  p_token text,
  p_phone text,
  p_channel text,
  p_status text,
  p_attempts int,
  p_expires_at timestamptz,
  p_error_message text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM yike_assert_otp_token(p_token);
  INSERT INTO otp_logs (
    phone, channel, provider, status, attempts, expires_at, error_message
  ) VALUES (
    p_phone, p_channel, 'sendchamp', p_status, COALESCE(p_attempts, 0), p_expires_at, p_error_message
  );
END;
$$;

GRANT EXECUTE ON FUNCTION yike_otp_latest(text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION yike_otp_insert_pending(text, text, text, timestamptz, text, text, timestamptz) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION yike_otp_mark_sent(text, uuid, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION yike_otp_mark_failed(text, uuid, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION yike_otp_mark_expired(text, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION yike_otp_increment_attempts(text, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION yike_otp_verify_success(text, uuid, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION yike_otp_find_verified(text, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION yike_otp_log_event(text, text, text, text, int, timestamptz, text) TO anon, authenticated, service_role;
