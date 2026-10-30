-- IP-scoped OTP rate limits for auth phone_otp_requests (hashed ip only; no raw IP storage in app logs).
-- Complements whatsapp_otp_sessions.ip_hash (seller SMS OTP sessions; legacy table name).

ALTER TABLE public.phone_otp_requests
  ADD COLUMN IF NOT EXISTS ip_hash TEXT;

CREATE INDEX IF NOT EXISTS phone_otp_requests_ip_created_idx
  ON public.phone_otp_requests (ip_hash, created_at DESC)
  WHERE ip_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS whatsapp_otp_sessions_ip_created_idx
  ON public.whatsapp_otp_sessions (ip_hash, created_at DESC)
  WHERE ip_hash IS NOT NULL;

CREATE OR REPLACE FUNCTION public.yike_otp_ip_send_count_hour(
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
  FROM public.phone_otp_requests r
  WHERE r.ip_hash = TRIM(p_ip_hash)
    AND r.status = 'sent'
    AND r.created_at > NOW() - INTERVAL '1 hour';
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.yike_otp_ip_verify_attempts_hour(
  p_token text,
  p_ip_hash text
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sum int;
BEGIN
  PERFORM yike_assert_otp_token(p_token);
  IF p_ip_hash IS NULL OR TRIM(p_ip_hash) = '' THEN
    RETURN 0;
  END IF;
  SELECT COALESCE(SUM(r.attempts), 0)::int INTO v_sum
  FROM public.phone_otp_requests r
  WHERE r.ip_hash = TRIM(p_ip_hash)
    AND r.created_at > NOW() - INTERVAL '1 hour';
  RETURN v_sum;
END;
$$;

-- Extend insert to persist ip_hash (optional — backwards compatible default NULL).
CREATE OR REPLACE FUNCTION public.yike_otp_insert_pending(
  p_token text,
  p_phone text,
  p_otp_hash text,
  p_expires_at timestamptz,
  p_channel text,
  p_provider text,
  p_last_sent_at timestamptz DEFAULT NULL,
  p_ip_hash text DEFAULT NULL
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
    phone, otp_hash, expires_at, attempts, channel, provider, status, last_sent_at, ip_hash
  ) VALUES (
    p_phone, p_otp_hash, p_expires_at, 0, p_channel, p_provider, 'pending', p_last_sent_at,
    NULLIF(TRIM(p_ip_hash), '')
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.yike_otp_ip_send_count_hour(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.yike_otp_ip_verify_attempts_hour(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.yike_otp_ip_send_count_hour(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.yike_otp_ip_verify_attempts_hour(text, text) TO service_role;

-- Re-assert service_role on insert (signature changed).
REVOKE ALL ON FUNCTION public.yike_otp_insert_pending(text, text, text, timestamptz, text, text, timestamptz, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.yike_otp_insert_pending(text, text, text, timestamptz, text, text, timestamptz, text)
  TO service_role;

NOTIFY pgrst, 'reload schema';
