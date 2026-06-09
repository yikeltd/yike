-- Clear RLS-enabled-with-no-policy linter findings without opening internal
-- OTP/config/admin tables to browser roles.

-- Internal/admin tables remain service-managed. Service role already bypasses
-- RLS, but these explicit policies document intent and satisfy policy presence.

DROP POLICY IF EXISTS "Service role can read admin user notes"
  ON public.admin_user_notes;
CREATE POLICY "Service role can read admin user notes"
  ON public.admin_user_notes
  FOR SELECT
  TO service_role
  USING (true);

DROP POLICY IF EXISTS "Service role can read admin verification requests"
  ON public.admin_verification_requests;
CREATE POLICY "Service role can read admin verification requests"
  ON public.admin_verification_requests
  FOR SELECT
  TO service_role
  USING (true);

DROP POLICY IF EXISTS "Service role can read auth email otps"
  ON public.auth_email_otps;
CREATE POLICY "Service role can read auth email otps"
  ON public.auth_email_otps
  FOR SELECT
  TO service_role
  USING (true);

DROP POLICY IF EXISTS "Service role can read auth signup pending"
  ON public.auth_signup_pending;
CREATE POLICY "Service role can read auth signup pending"
  ON public.auth_signup_pending
  FOR SELECT
  TO service_role
  USING (true);

DROP POLICY IF EXISTS "Service role can read email otp requests"
  ON public.email_otp_requests;
CREATE POLICY "Service role can read email otp requests"
  ON public.email_otp_requests
  FOR SELECT
  TO service_role
  USING (true);

DROP POLICY IF EXISTS "Service role can read phone otp requests"
  ON public.phone_otp_requests;
CREATE POLICY "Service role can read phone otp requests"
  ON public.phone_otp_requests
  FOR SELECT
  TO service_role
  USING (true);

DROP POLICY IF EXISTS "Service role can read internal config"
  ON public.yike_internal_config;
CREATE POLICY "Service role can read internal config"
  ON public.yike_internal_config
  FOR SELECT
  TO service_role
  USING (true);

-- Operational logs are visible only to staff responsible for system health.

DROP POLICY IF EXISTS "Tech staff can read email logs"
  ON public.email_logs;
CREATE POLICY "Tech staff can read email logs"
  ON public.email_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.is_banned = false
        AND p.role IN ('super_admin', 'admin', 'tech')
    )
  );

DROP POLICY IF EXISTS "Tech staff can read otp logs"
  ON public.otp_logs;
CREATE POLICY "Tech staff can read otp logs"
  ON public.otp_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.is_banned = false
        AND p.role IN ('super_admin', 'admin', 'tech')
    )
  );

-- Company verification uses the signed-in server client for applicant checks
-- and submission, so owners need narrow direct access to their own rows.

DROP POLICY IF EXISTS "Company verification owners can read own requests"
  ON public.company_verification_requests;
CREATE POLICY "Company verification owners can read own requests"
  ON public.company_verification_requests
  FOR SELECT
  TO authenticated
  USING (
    company_id = auth.uid()
    OR submitted_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.is_banned = false
        AND p.role IN ('super_admin', 'admin')
    )
  );

DROP POLICY IF EXISTS "Company verification owners can create requests"
  ON public.company_verification_requests;
CREATE POLICY "Company verification owners can create requests"
  ON public.company_verification_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id = auth.uid()
    AND submitted_by = auth.uid()
    AND status = 'pending'
    AND admin_notes IS NULL
    AND reviewed_by IS NULL
    AND reviewed_at IS NULL
  );

NOTIFY pgrst, 'reload schema';
