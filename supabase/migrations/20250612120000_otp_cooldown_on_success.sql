-- Cooldown only after successful OTP delivery (not on failed/pending attempts)

CREATE OR REPLACE FUNCTION yike_otp_insert_pending(
  p_token text,
  p_phone text,
  p_otp_hash text,
  p_expires_at timestamptz,
  p_channel text,
  p_provider text,
  p_last_sent_at timestamptz DEFAULT NULL
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
    error_message = NULL,
    last_sent_at = NOW()
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
  SET status = 'failed', error_message = p_error_message, last_sent_at = NULL
  WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION yike_otp_last_sent_at(p_token text, p_phone text)
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
  FROM phone_otp_requests r
  WHERE r.phone = p_phone
    AND r.status = 'sent'
    AND r.last_sent_at IS NOT NULL
  ORDER BY r.last_sent_at DESC
  LIMIT 1;
  RETURN v_last;
END;
$$;

CREATE OR REPLACE FUNCTION yike_otp_latest_verifiable(p_token text, p_phone text)
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
    AND r.status = 'sent'
    AND r.verified = FALSE
  ORDER BY r.created_at DESC
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION yike_otp_last_sent_at(text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION yike_otp_latest_verifiable(text, text) TO anon, authenticated, service_role;
