-- Clear Supabase security linter warnings for mutable search paths, broad public
-- insert policies, bucket object listing, and exposed SECURITY DEFINER functions.

-- ── Function search paths ───────────────────────────────────────────────────

ALTER FUNCTION public.set_updated_at()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.is_staff_admin()
  SECURITY INVOKER;

ALTER FUNCTION public.is_staff_admin()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.slugify_property_text(text)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.properties_set_slug_on_insert()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.yike_generate_public_listing_code()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.yike_generate_public_agent_code(uuid)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.yike_generate_lead_code()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.sync_profile_account_status()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.check_agent_listing_limit()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.sync_company_cover_from_cover_url()
  SET search_path = public, pg_temp;

-- Admin PIN reset is now called by trusted server code after route-level
-- super-admin checks, so it can run under service_role instead of authenticated.
CREATE OR REPLACE FUNCTION public.yike_admin_reset_profile_pin(
  p_target_id uuid,
  p_pin_type text,
  p_pin_hash text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_target_role text;
  v_banned boolean;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'not_authenticated';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
        AND is_banned = FALSE
    ) THEN
      RAISE EXCEPTION 'not_authorized';
    END IF;
  END IF;

  IF p_pin_hash IS NULL OR length(p_pin_hash) < 10 THEN
    RAISE EXCEPTION 'invalid_pin_hash';
  END IF;

  SELECT role, is_banned
  INTO v_target_role, v_banned
  FROM profiles
  WHERE id = p_target_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  IF v_banned THEN
    RAISE EXCEPTION 'profile_banned';
  END IF;

  IF p_pin_type = 'admin' THEN
    IF v_target_role NOT IN (
      'super_admin', 'admin', 'support', 'tech', 'content', 'careers', 'moderator'
    ) THEN
      RAISE EXCEPTION 'admin_pin_staff_only';
    END IF;
    UPDATE profiles SET admin_pin_hash = p_pin_hash WHERE id = p_target_id;
  ELSIF p_pin_type = 'login' THEN
    UPDATE profiles SET pin_hash = p_pin_hash WHERE id = p_target_id;
  ELSE
    RAISE EXCEPTION 'invalid_pin_type';
  END IF;
END;
$$;

-- ── RLS policy tightening ───────────────────────────────────────────────────

DROP POLICY IF EXISTS listing_analytics_events_insert
  ON public.listing_analytics_events;

CREATE POLICY listing_analytics_events_insert
  ON public.listing_analytics_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    listing_id IS NOT NULL
    AND event_type IN (
      'view',
      'save',
      'unsave',
      'whatsapp_click',
      'call_click',
      'share',
      'search_impression'
    )
    AND (user_id IS NULL OR user_id = auth.uid())
    AND char_length(COALESCE(session_id, '')) <= 128
    AND char_length(COALESCE(city, '')) <= 120
    AND char_length(COALESCE(state, '')) <= 120
    AND jsonb_typeof(metadata) = 'object'
  );

DROP POLICY IF EXISTS "Anyone can create reports"
  ON public.listing_reports;

CREATE POLICY "Anyone can create reports"
  ON public.listing_reports
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    property_id IS NOT NULL
    AND char_length(trim(reason)) BETWEEN 3 AND 120
    AND char_length(COALESCE(reporter_name, '')) <= 120
    AND char_length(COALESCE(reporter_phone, '')) <= 40
    AND char_length(COALESCE(message, '')) <= 2000
    AND status IN ('open', 'pending')
    AND (reporter_user_id IS NULL OR reporter_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Anyone can submit property request"
  ON public.property_requests;

CREATE POLICY "Anyone can submit property request"
  ON public.property_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(trim(city)) BETWEEN 2 AND 120
    AND char_length(COALESCE(area, '')) <= 120
    AND char_length(trim(whatsapp)) BETWEEN 7 AND 40
    AND listing_type IN ('rent', 'lease', 'sale', 'shortlet')
    AND (budget_min IS NULL OR budget_min >= 0)
    AND (budget_max IS NULL OR budget_max >= 0)
    AND (
      budget_min IS NULL
      OR budget_max IS NULL
      OR budget_max >= budget_min
    )
    AND (bedrooms IS NULL OR bedrooms BETWEEN 0 AND 20)
    AND char_length(COALESCE(property_type, '')) <= 80
    AND char_length(COALESCE(notes, '')) <= 2000
    AND status = 'open'
  );

-- Public buckets can serve object URLs without allowing clients to list all
-- objects. Upload/update/delete ownership policies stay intact.
DROP POLICY IF EXISTS "Profile images public read"
  ON storage.objects;

-- ── SECURITY DEFINER executable grants ──────────────────────────────────────

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
      'REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated',
      fn.schema_name,
      fn.function_name,
      fn.identity_args
    );

    EXECUTE format(
      'GRANT EXECUTE ON FUNCTION %I.%I(%s) TO service_role',
      fn.schema_name,
      fn.function_name,
      fn.identity_args
    );
  END LOOP;
END;
$$;

NOTIFY pgrst, 'reload schema';
