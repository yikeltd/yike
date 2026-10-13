-- Phase 1: Universal Listing Foundation Migration
-- 1. Expand asset_type check to include 'ELECTRONICS'
-- 2. Add first-class universal condition model with backward-compatible sync
-- 3. Enforce universal active-listing ceiling (default 3) with row-locked concurrency safety

-- ---------------------------------------------------------------------------
-- 1. Expand asset_type check
-- ---------------------------------------------------------------------------
ALTER TABLE public.properties
  DROP CONSTRAINT IF EXISTS properties_asset_type_check;

ALTER TABLE public.properties
  ADD CONSTRAINT properties_asset_type_check
  CHECK (asset_type IN ('PROPERTY', 'VEHICLE', 'ELECTRONICS'));

COMMENT ON COLUMN public.properties.asset_type IS
  'Marketplace vertical: PROPERTY | VEHICLE | ELECTRONICS. Universal SSOT discriminator.';

-- ---------------------------------------------------------------------------
-- 2. Universal Condition Model
-- ---------------------------------------------------------------------------
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS condition TEXT;

-- Backfill condition from vehicle_condition where vehicle_condition is set
UPDATE public.properties
SET condition = vehicle_condition
WHERE condition IS NULL AND vehicle_condition IS NOT NULL;

-- Validate condition values (idempotent, forward-only)
ALTER TABLE public.properties
  DROP CONSTRAINT IF EXISTS properties_condition_check;

ALTER TABLE public.properties
  ADD CONSTRAINT properties_condition_check
  CHECK (
    condition IS NULL
    OR condition IN (
      'brand_new',
      'open_box',
      'refurbished',
      'foreign_used',
      'nigerian_used',
      'for_parts'
    )
  ) NOT VALID;

COMMENT ON COLUMN public.properties.condition IS
  'Universal listing condition: brand_new | open_box | refurbished | foreign_used | nigerian_used | for_parts.';

-- Two-way condition sync trigger to guarantee vehicle_condition backward compatibility
CREATE OR REPLACE FUNCTION public.sync_listing_condition()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync vehicle_condition -> condition if condition not set
  IF NEW.condition IS NULL AND NEW.vehicle_condition IS NOT NULL THEN
    NEW.condition := NEW.vehicle_condition;
  END IF;

  -- Sync condition -> vehicle_condition for vehicles if vehicle_condition not set
  IF NEW.vehicle_condition IS NULL AND NEW.condition IS NOT NULL AND NEW.asset_type = 'VEHICLE' THEN
    NEW.vehicle_condition := NEW.condition;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_listing_condition ON public.properties;
CREATE TRIGGER trg_sync_listing_condition
  BEFORE INSERT OR UPDATE OF condition, vehicle_condition, asset_type ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_listing_condition();

-- ---------------------------------------------------------------------------
-- 3. Update listings View
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.listings
WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.title,
  p.description,
  p.price,
  p.asset_type,
  p.property_type AS property_category,
  p.auto_category,
  COALESCE(p.condition, p.vehicle_condition) AS condition,
  p.vehicle_condition,
  CASE
    WHEN p.is_verified_listing THEN 'verified'
    ELSE 'unverified'
  END AS verification_status,
  p.state,
  p.city,
  p.area,
  p.media_urls AS images,
  p.attributes,
  p.status AS moderation_status,
  (p.status = 'approved' AND p.expires_at > NOW()) AS is_active,
  p.is_featured,
  p.agent_id AS vendor_id,
  p.listing_type AS intent,
  p.make,
  p.model,
  p.year,
  p.trim,
  p.transmission,
  p.fuel_type,
  p.mileage,
  p.body_type,
  p.drivetrain,
  p.engine,
  p.exterior_color,
  p.interior_color,
  p.registration_status,
  p.financing_available,
  p.slug,
  p.expires_at,
  p.created_at,
  p.updated_at
FROM public.properties p;

GRANT SELECT ON public.listings TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. Authoritative Universal 3-Listing Limit Trigger (Concurrency Safe)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_agent_listing_limit()
RETURNS TRIGGER AS $$
DECLARE
  prof RECORD;
  active_count INT;
  cap INT;
  acct TEXT;
  becoming_active BOOLEAN;
  was_active BOOLEAN;
BEGIN
  -- Active and in-review statuses
  becoming_active := NEW.status IN ('pending', 'approved', 'flagged');

  -- On UPDATE, if the row was already active and agent_id did not change,
  -- this update does not increment the seller's active listing count.
  IF TG_OP = 'UPDATE' THEN
    was_active := OLD.status IN ('pending', 'approved', 'flagged');
    IF (OLD.agent_id = NEW.agent_id) AND (NOT becoming_active OR was_active) THEN
      RETURN NEW;
    END IF;
  END IF;

  -- If row is not becoming active/review (e.g. archived, rejected, rented, sold),
  -- allow without checking listing capacity.
  IF NOT becoming_active THEN
    RETURN NEW;
  END IF;

  -- Lock the seller profile row using SELECT FOR UPDATE to serialize
  -- concurrent listing creation transactions for this seller.
  SELECT
    role, listing_limit, subscription_plan_code, profile_status, account_status,
    verification_required, is_banned
  INTO prof
  FROM public.profiles
  WHERE id = NEW.agent_id
  FOR UPDATE;

  IF prof IS NULL THEN
    RAISE EXCEPTION 'Agent profile not found';
  END IF;

  IF prof.is_banned THEN
    RAISE EXCEPTION 'Account restricted. Contact Yike support.';
  END IF;

  acct := COALESCE(prof.account_status, prof.profile_status::text, 'active');

  IF acct IN ('suspended', 'deleted') THEN
    RAISE EXCEPTION 'Account restricted. Contact Yike support.';
  END IF;

  IF acct IN ('on_hold', 'pending_verification')
     OR (prof.verification_required AND acct <> 'active') THEN
    RAISE EXCEPTION 'Your account is under review. Contact Yike to verify or restore posting.';
  END IF;

  -- Staff / admin bypass
  IF prof.role IN ('admin', 'super_admin') THEN
    RETURN NEW;
  END IF;

  -- Developer subscription plan bypass (unlimited capacity)
  IF prof.subscription_plan_code = 'developer' THEN
    RETURN NEW;
  END IF;

  -- Determine effective cap: custom profile limit if set, otherwise universal default of 3
  IF prof.listing_limit IS NOT NULL AND prof.listing_limit > 0 THEN
    cap := prof.listing_limit;
  ELSE
    cap := 3;
  END IF;

  -- Count all active/review listings across all categories (PROPERTY, VEHICLE, ELECTRONICS)
  -- For UPDATE, exclude the row itself.
  SELECT COUNT(*)::INT INTO active_count
  FROM public.properties
  WHERE agent_id = NEW.agent_id
    AND status IN ('pending', 'approved', 'flagged')
    AND (TG_OP = 'INSERT' OR id <> NEW.id);

  IF active_count >= cap THEN
    RAISE EXCEPTION 'Listing limit reached (%). Maximum % active listings allowed across all categories.', cap, cap;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure triggers are attached for both INSERT and UPDATE
DROP TRIGGER IF EXISTS enforce_agent_listing_limit ON public.properties;
CREATE TRIGGER enforce_agent_listing_limit
  BEFORE INSERT ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.check_agent_listing_limit();

DROP TRIGGER IF EXISTS enforce_agent_listing_limit_update ON public.properties;
CREATE TRIGGER enforce_agent_listing_limit_update
  BEFORE UPDATE OF status, agent_id, expires_at ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.check_agent_listing_limit();
