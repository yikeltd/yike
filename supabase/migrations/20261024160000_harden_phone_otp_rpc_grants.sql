-- Harden token-gated phone OTP RPCs: client roles must not EXECUTE (token + service_role only).
-- Aligns with 20260726001850 pattern. Do not apply until reviewed; not applied automatically.

REVOKE ALL ON FUNCTION public.yike_otp_latest(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.yike_otp_insert_pending(text, text, text, timestamptz, text, text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.yike_otp_mark_sent(text, uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.yike_otp_mark_failed(text, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.yike_otp_mark_expired(text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.yike_otp_increment_attempts(text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.yike_otp_verify_success(text, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.yike_otp_find_verified(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.yike_otp_log_event(text, text, text, text, int, timestamptz, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.yike_otp_last_sent_at(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.yike_otp_latest_verifiable(text, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.yike_otp_latest(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.yike_otp_insert_pending(text, text, text, timestamptz, text, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.yike_otp_mark_sent(text, uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.yike_otp_mark_failed(text, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.yike_otp_mark_expired(text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.yike_otp_increment_attempts(text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.yike_otp_verify_success(text, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.yike_otp_find_verified(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.yike_otp_log_event(text, text, text, text, int, timestamptz, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.yike_otp_last_sent_at(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.yike_otp_latest_verifiable(text, text) TO service_role;

-- Consume OTP row once: ignore repeat verify_success on already-verified challenges.
CREATE OR REPLACE FUNCTION public.yike_otp_verify_success(
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
  WHERE id = p_id
    AND verified = FALSE
    AND status = 'sent';
END;
$$;

NOTIFY pgrst, 'reload schema';
