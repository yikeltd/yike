-- Boost promotions alongside featured (same listing_promotions table)

ALTER TABLE public.listing_promotions
  ADD COLUMN IF NOT EXISTS duration_hours INTEGER,
  ADD COLUMN IF NOT EXISTS boost_score INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.listing_promotions DROP CONSTRAINT IF EXISTS listing_promotions_type_check;
ALTER TABLE public.listing_promotions
  ADD CONSTRAINT listing_promotions_type_check
  CHECK (promotion_type IN ('featured', 'boost'));

ALTER TABLE public.listing_promotions DROP CONSTRAINT IF EXISTS listing_promotions_duration_check;
ALTER TABLE public.listing_promotions
  ADD CONSTRAINT listing_promotions_duration_check
  CHECK (
    (promotion_type = 'featured' AND duration_days IN (7, 30) AND COALESCE(duration_hours, 0) = 0)
    OR (
      promotion_type = 'boost'
      AND (
        (duration_hours = 24 AND duration_days = 0)
        OR (duration_days = 7 AND COALESCE(duration_hours, 0) = 0)
      )
    )
  );

-- Boost analytics counters (boost_until uses existing properties.boosted_until)
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS boost_impressions INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS boost_clicks INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS properties_active_boost_idx
  ON public.properties (is_boosted, boosted_until DESC NULLS LAST)
  WHERE status = 'approved' AND is_boosted = TRUE;

-- Agents cannot self-boost via property updates
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

    IF COALESCE(NEW.is_boosted, FALSE) THEN
      RAISE EXCEPTION 'listing_boost_escalation_denied';
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

  IF NEW.is_boosted IS DISTINCT FROM OLD.is_boosted
     OR NEW.boosted_until IS DISTINCT FROM OLD.boosted_until THEN
    RAISE EXCEPTION 'listing_boost_escalation_denied';
  END IF;

  IF NEW.featured_until IS DISTINCT FROM OLD.featured_until
     OR NEW.boost_level IS DISTINCT FROM OLD.boost_level
     OR NEW.boost_priority IS DISTINCT FROM OLD.boost_priority
     OR NEW.boosted_at IS DISTINCT FROM OLD.boosted_at
     OR NEW.boosted_by IS DISTINCT FROM OLD.boosted_by
     OR NEW.sponsored_status IS DISTINCT FROM OLD.sponsored_status
     OR NEW.boost_score IS DISTINCT FROM OLD.boost_score THEN
    RAISE EXCEPTION 'listing_promotion_escalation_denied';
  END IF;

  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "Agent listers insert own listings" ON public.properties;
CREATE POLICY "Agent listers insert own listings"
  ON public.properties
  FOR INSERT
  TO authenticated
  WITH CHECK (
    agent_id = auth.uid()
    AND status = 'pending'
    AND COALESCE(is_featured, FALSE) = FALSE
    AND COALESCE(is_boosted, FALSE) = FALSE
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

NOTIFY pgrst, 'reload schema';
