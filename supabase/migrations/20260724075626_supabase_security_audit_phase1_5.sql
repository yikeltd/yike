-- Supabase security audit (Phases 1–5): RLS policy presence, search_path hardening,
-- storage bucket listing removal, SECURITY DEFINER RPC grant audit.
-- Project: hlpojfurfldvcxfxhveg (Yike production)

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 1 — RLS-enabled tables missing policies (deny client roles by default)
-- ═══════════════════════════════════════════════════════════════════════════

-- ad_clicks / ad_impressions — analytics written by service_role API routes only
ALTER TABLE public.ad_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.ad_clicks FROM anon, authenticated;
REVOKE ALL ON public.ad_impressions FROM anon, authenticated;

DROP POLICY IF EXISTS ad_clicks_service_role ON public.ad_clicks;
CREATE POLICY ad_clicks_service_role ON public.ad_clicks
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS ad_impressions_service_role ON public.ad_impressions;
CREATE POLICY ad_impressions_service_role ON public.ad_impressions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS ad_clicks_deny_clients ON public.ad_clicks;
CREATE POLICY ad_clicks_deny_clients ON public.ad_clicks
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS ad_impressions_deny_clients ON public.ad_impressions;
CREATE POLICY ad_impressions_deny_clients ON public.ad_impressions
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

-- listing_submit_log — rate-limit telemetry from submit-guard API (service_role)
ALTER TABLE public.listing_submit_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.listing_submit_log FROM anon, authenticated;

DROP POLICY IF EXISTS listing_submit_log_service_role ON public.listing_submit_log;
CREATE POLICY listing_submit_log_service_role ON public.listing_submit_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS listing_submit_log_deny_clients ON public.listing_submit_log;
CREATE POLICY listing_submit_log_deny_clients ON public.listing_submit_log
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

-- scheduled_email_jobs — cron/email worker queue (service_role)
ALTER TABLE public.scheduled_email_jobs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.scheduled_email_jobs FROM anon, authenticated;

DROP POLICY IF EXISTS scheduled_email_jobs_service_role ON public.scheduled_email_jobs;
CREATE POLICY scheduled_email_jobs_service_role ON public.scheduled_email_jobs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS scheduled_email_jobs_deny_clients ON public.scheduled_email_jobs;
CREATE POLICY scheduled_email_jobs_deny_clients ON public.scheduled_email_jobs
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

-- whatsapp_otp_sessions — OTP provider session log (service_role)
ALTER TABLE public.whatsapp_otp_sessions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.whatsapp_otp_sessions FROM anon, authenticated;

DROP POLICY IF EXISTS whatsapp_otp_sessions_service_role ON public.whatsapp_otp_sessions;
CREATE POLICY whatsapp_otp_sessions_service_role ON public.whatsapp_otp_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS whatsapp_otp_sessions_deny_clients ON public.whatsapp_otp_sessions;
CREATE POLICY whatsapp_otp_sessions_deny_clients ON public.whatsapp_otp_sessions
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

-- verification_control_config — singleton trust gates
-- Read by authenticated trust-status API; writes staff/service only.
ALTER TABLE public.verification_control_config ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.verification_control_config FROM anon;

DROP POLICY IF EXISTS verification_control_config_staff ON public.verification_control_config;
CREATE POLICY verification_control_config_staff ON public.verification_control_config
  FOR ALL TO authenticated
  USING (public.is_staff_admin())
  WITH CHECK (public.is_staff_admin());

DROP POLICY IF EXISTS verification_control_config_authenticated_read
  ON public.verification_control_config;
CREATE POLICY verification_control_config_authenticated_read
  ON public.verification_control_config
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS verification_control_config_service_role
  ON public.verification_control_config;
CREATE POLICY verification_control_config_service_role
  ON public.verification_control_config
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS verification_control_config_deny_anon
  ON public.verification_control_config;
CREATE POLICY verification_control_config_deny_anon
  ON public.verification_control_config
  FOR ALL TO anon
  USING (false) WITH CHECK (false);

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 2 — Immutable search_path on SECURITY DEFINER (and flagged) functions
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT
      n.nspname AS schema_name,
      p.proname AS function_name,
      pg_get_function_identity_arguments(p.oid) AS identity_args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = TRUE
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %I.%I(%s) SET search_path = public, pg_temp',
      fn.schema_name,
      fn.function_name,
      fn.identity_args
    );
  END LOOP;
END;
$$;

-- Trigger helpers flagged by linter (not SECURITY DEFINER but mutable search_path)
ALTER FUNCTION public.set_listing_promotions_updated_at()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.check_agent_listing_limit()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.yike_normalize_phone_digits(text)
  SET search_path = public, pg_temp;

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 3 — Storage: keep public object URLs, remove bucket-wide listing
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Property media public read" ON storage.objects;
DROP POLICY IF EXISTS "Public read ad creatives" ON storage.objects;

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 4 — SECURITY DEFINER RPC execute grants (trigger fns stay internal)
-- ═══════════════════════════════════════════════════════════════════════════

REVOKE ALL ON FUNCTION public.enforce_listing_moderation_guard() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_agent_listing_limit() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_listing_promotions_updated_at() FROM PUBLIC, anon, authenticated;

-- Intentional client-callable RPCs (token-gated or aggregated public data)
GRANT EXECUTE ON FUNCTION public.get_profile_social_stats(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_listing_like_count(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_public_follow_profiles(uuid, text, int, int) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.yike_check_signup_duplicates(text, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_property_views(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_contact_clicks(uuid) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
