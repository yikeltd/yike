-- Marketplace Listings SSOT
-- Physical store remains `properties` (preserves FKs / RLS / ops).
-- Logical SSOT is multi-vertical via asset_type + attributes + `listings` view.
-- Vehicle rows live in the same table with asset_type = 'VEHICLE'.

-- ---------------------------------------------------------------------------
-- 1. Vertical columns on properties
-- ---------------------------------------------------------------------------
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS asset_type TEXT NOT NULL DEFAULT 'PROPERTY';

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS auto_category TEXT;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS vehicle_condition TEXT;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS attributes JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS make TEXT;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS model TEXT;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS year INT;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS trim TEXT;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS transmission TEXT;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS fuel_type TEXT;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS mileage INT;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS vin TEXT;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS exterior_color TEXT;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS interior_color TEXT;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS body_type TEXT;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS drivetrain TEXT;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS engine TEXT;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS registration_status TEXT;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS financing_available BOOLEAN NOT NULL DEFAULT FALSE;

-- Soften property_type for non-property rows (drop legacy check if present)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'properties'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%property_type%'
  LOOP
    EXECUTE format('ALTER TABLE properties DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE properties
  DROP CONSTRAINT IF EXISTS properties_asset_type_check;

ALTER TABLE properties
  ADD CONSTRAINT properties_asset_type_check
  CHECK (asset_type IN ('PROPERTY', 'VEHICLE'));

ALTER TABLE properties
  DROP CONSTRAINT IF EXISTS properties_auto_category_check;

ALTER TABLE properties
  ADD CONSTRAINT properties_auto_category_check
  CHECK (
    auto_category IS NULL
    OR auto_category IN (
      'car', 'suv', 'truck', 'van', 'motorcycle',
      'commercial', 'heavy_equipment', 'boat'
    )
  );

CREATE INDEX IF NOT EXISTS properties_asset_type_idx
  ON properties (asset_type, status, created_at DESC);

CREATE INDEX IF NOT EXISTS properties_vehicle_search_idx
  ON properties (asset_type, auto_category, make, model, year)
  WHERE asset_type = 'VEHICLE';

CREATE INDEX IF NOT EXISTS properties_attributes_gin
  ON properties USING GIN (attributes);

COMMENT ON COLUMN properties.asset_type IS
  'Marketplace vertical: PROPERTY | VEHICLE. Future verticals extend this check.';
COMMENT ON COLUMN properties.attributes IS
  'Vertical-specific JSON specs (reusable; not hardcoded forms).';

-- Backfill
UPDATE properties
SET asset_type = 'PROPERTY'
WHERE asset_type IS NULL OR asset_type = '';

-- ---------------------------------------------------------------------------
-- 2. Logical listings SSOT view (read path for marketplace feed)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW listings
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
  p.vehicle_condition AS condition,
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
FROM properties p;

COMMENT ON VIEW listings IS
  'Marketplace listings SSOT read model over properties. Writes go to properties with asset_type.';

GRANT SELECT ON listings TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Dealer account type — extend profiles.account_type check
-- ---------------------------------------------------------------------------
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_account_type_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_account_type_check
  CHECK (account_type IN (
    'individual', 'agency', 'developer', 'landlord', 'agent', 'dealer',
    'city_ambassador', 'field_verifier', 'legal_partner', 'service_provider'
  ));
