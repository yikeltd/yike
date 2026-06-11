-- Prevent agents from self-approving or moderating their own listings.
-- Service role (admin API) and staff bypass via trigger + tightened RLS.

CREATE OR REPLACE FUNCTION public.yike_listing_moderation_bypass()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(auth.role(), '') = 'service_role'
    OR public.is_staff_admin();
$$;

CREATE OR REPLACE FUNCTION public.enforce_listing_moderation_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF public.yike_listing_moderation_bypass() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.agent_id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'listing_owner_required';
    END IF;

    IF NEW.status IS DISTINCT FROM 'pending' THEN
      RAISE EXCEPTION 'listing_status_escalation_denied';
    END IF;

    IF COALESCE(NEW.is_featured, FALSE) THEN
      RAISE EXCEPTION 'listing_feature_escalation_denied';
    END IF;

    RETURN NEW;
  END IF;

  IF NEW.agent_id IS DISTINCT FROM OLD.agent_id
     AND NOT public.yike_listing_moderation_bypass() THEN
    RAISE EXCEPTION 'listing_owner_change_denied';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status IN ('approved', 'rejected', 'hidden', 'flagged') THEN
    RAISE EXCEPTION 'listing_status_escalation_denied';
  END IF;

  IF NEW.is_featured IS DISTINCT FROM OLD.is_featured THEN
    RAISE EXCEPTION 'listing_feature_escalation_denied';
  END IF;

  IF NEW.featured_until IS DISTINCT FROM OLD.featured_until
     OR NEW.boost_level IS DISTINCT FROM OLD.boost_level
     OR NEW.boost_priority IS DISTINCT FROM OLD.boost_priority
     OR NEW.boosted_at IS DISTINCT FROM OLD.boosted_at
     OR NEW.boosted_by IS DISTINCT FROM OLD.boosted_by
     OR NEW.sponsored_status IS DISTINCT FROM OLD.sponsored_status THEN
    RAISE EXCEPTION 'listing_promotion_escalation_denied';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_listing_moderation_guard ON public.properties;
CREATE TRIGGER enforce_listing_moderation_guard
  BEFORE INSERT OR UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_listing_moderation_guard();

-- Tighten insert policy: agents only create pending, non-featured listings.
DROP POLICY IF EXISTS "Agent listers insert own listings" ON public.properties;
CREATE POLICY "Agent listers insert own listings"
  ON public.properties
  FOR INSERT
  TO authenticated
  WITH CHECK (
    agent_id = auth.uid()
    AND status = 'pending'
    AND COALESCE(is_featured, FALSE) = FALSE
    AND (
      EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('agent_unverified', 'agent_verified')
          AND is_banned = FALSE
      )
      OR public.is_staff_admin()
    )
  );

-- Agents may update own listing content; moderation columns guarded by trigger.
DROP POLICY IF EXISTS "Agents update own listings" ON public.properties;
CREATE POLICY "Agents update own listing content"
  ON public.properties
  FOR UPDATE
  TO authenticated
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage all listings" ON public.properties;
CREATE POLICY "Staff manage all listings"
  ON public.properties
  FOR UPDATE
  TO authenticated
  USING (public.is_staff_admin())
  WITH CHECK (public.is_staff_admin());

NOTIFY pgrst, 'reload schema';
