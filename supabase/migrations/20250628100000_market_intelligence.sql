-- Market pricing intelligence + final hardening fields

-- ── Market price memory ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS market_price_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_key TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL,
  city TEXT,
  lga TEXT,
  area TEXT,
  neighborhood TEXT,
  property_type TEXT NOT NULL,
  listing_purpose TEXT NOT NULL,
  bedrooms INTEGER,
  size_bucket TEXT,
  sample_count INTEGER NOT NULL DEFAULT 0,
  min_price NUMERIC,
  max_price NUMERIC,
  avg_price NUMERIC,
  median_price NUMERIC,
  p25_price NUMERIC,
  p75_price NUMERIC,
  p90_price NUMERIC,
  currency TEXT NOT NULL DEFAULT 'NGN',
  confidence_level TEXT NOT NULL DEFAULT 'low',
  last_calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS market_price_memory_lookup_idx
  ON market_price_memory (state, city, area, property_type, listing_purpose);

-- ── Luxury zone tolerance ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS market_luxury_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL,
  city TEXT,
  area TEXT,
  neighborhood TEXT,
  tolerance_multiplier NUMERIC NOT NULL DEFAULT 2.5,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS market_luxury_zones_lookup_idx
  ON market_luxury_zones (state, city, area, neighborhood)
  WHERE active = TRUE;

INSERT INTO market_luxury_zones (state, city, area, neighborhood, tolerance_multiplier)
SELECT v.state, v.city, v.area, v.neighborhood, v.mult
FROM (VALUES
  ('Lagos', 'Lagos', 'Ikoyi', NULL::TEXT, 3.0),
  ('Lagos', 'Lagos', 'Banana Island', NULL, 3.5),
  ('Lagos', 'Lagos', 'Victoria Island', NULL, 3.0),
  ('Lagos', 'Lagos', 'Lekki', 'Lekki Phase 1', 2.8),
  ('Lagos', 'Lagos', 'Eko Atlantic', NULL, 3.0),
  ('FCT', 'Abuja', 'Maitama', NULL, 2.8),
  ('FCT', 'Abuja', 'Asokoro', NULL, 2.8),
  ('Rivers', 'Port Harcourt', 'GRA', NULL, 2.5)
) AS v(state, city, area, neighborhood, mult)
WHERE NOT EXISTS (SELECT 1 FROM market_luxury_zones LIMIT 1);

-- ── Canonical locations ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS canonical_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT NOT NULL,
  aliases TEXT[] NOT NULL DEFAULT '{}',
  state TEXT NOT NULL,
  city TEXT,
  lga TEXT,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS canonical_locations_slug_idx
  ON canonical_locations (slug);
CREATE INDEX IF NOT EXISTS canonical_locations_name_idx
  ON canonical_locations (canonical_name);

INSERT INTO canonical_locations (canonical_name, aliases, state, city, lga, slug)
SELECT v.name, v.aliases, v.state, v.city, v.lga, v.slug
FROM (VALUES
  ('Lekki Phase 1', ARRAY['lekki phase one', 'lekki1', 'lekki p1', 'lekki 1'], 'Lagos', 'Lagos', NULL, 'lekki-phase-1'),
  ('Lekki Phase 2', ARRAY['lekki phase two', 'lekki2', 'lekki p2'], 'Lagos', 'Lagos', NULL, 'lekki-phase-2'),
  ('Victoria Island', ARRAY['vi', 'v.i', 'victoria isl'], 'Lagos', 'Lagos', NULL, 'victoria-island'),
  ('Ogbor Hill', ARRAY['ogborhill', 'ogbor-hill'], 'Abia', 'Aba', NULL, 'ogbor-hill'),
  ('Orumba North', ARRAY['orumba east', 'orumba-east'], 'Anambra', NULL, 'Orumba North', 'orumba-north')
) AS v(name, aliases, state, city, lga, slug)
WHERE NOT EXISTS (SELECT 1 FROM canonical_locations LIMIT 1);

-- ── Area demand memory ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS area_demand_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_key TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL,
  city TEXT,
  area TEXT,
  property_type TEXT,
  search_count INTEGER NOT NULL DEFAULT 0,
  save_count INTEGER NOT NULL DEFAULT 0,
  whatsapp_click_count INTEGER NOT NULL DEFAULT 0,
  inquiry_count INTEGER NOT NULL DEFAULT 0,
  demand_score INTEGER NOT NULL DEFAULT 0,
  last_calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Listing pricing intelligence ──────────────────────────────────────────────

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS price_confidence_score NUMERIC,
  ADD COLUMN IF NOT EXISTS price_anomaly_level TEXT,
  ADD COLUMN IF NOT EXISTS price_anomaly_reason TEXT,
  ADD COLUMN IF NOT EXISTS price_review_status TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS price_reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS price_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS market_price_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS quality_score INTEGER,
  ADD COLUMN IF NOT EXISTS quality_level TEXT,
  ADD COLUMN IF NOT EXISTS fraud_risk_score INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS moderation_flags TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_price_anomaly_level_check;
ALTER TABLE properties
  ADD CONSTRAINT properties_price_anomaly_level_check
  CHECK (
    price_anomaly_level IS NULL
    OR price_anomaly_level IN (
      'normal', 'slightly_high', 'high', 'unusually_high',
      'slightly_low', 'unusually_low', 'luxury_exception', 'insufficient_data'
    )
  );

ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_price_review_status_check;
ALTER TABLE properties
  ADD CONSTRAINT properties_price_review_status_check
  CHECK (price_review_status IN (
    'none', 'needs_confirmation', 'confirmed_by_agent',
    'admin_review', 'approved', 'adjusted', 'ignored'
  ));

ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_quality_level_check;
ALTER TABLE properties
  ADD CONSTRAINT properties_quality_level_check
  CHECK (quality_level IS NULL OR quality_level IN ('low', 'medium', 'high', 'premium'));

CREATE INDEX IF NOT EXISTS properties_price_anomaly_idx
  ON properties (price_anomaly_level)
  WHERE price_anomaly_level IS NOT NULL AND price_anomaly_level <> 'normal';
CREATE INDEX IF NOT EXISTS properties_price_review_idx
  ON properties (price_review_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS properties_pricing_lookup_idx
  ON properties (state, city, area, property_type, listing_type, price);

-- ── Profile / company prep ────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS profile_completion_score INTEGER,
  ADD COLUMN IF NOT EXISTS parent_company_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS managed_by_company BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS company_role TEXT;

-- ── Lead interaction dedup ────────────────────────────────────────────────────

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS interaction_count INTEGER NOT NULL DEFAULT 1;

-- ── RLS (internal only) ───────────────────────────────────────────────────────

ALTER TABLE market_price_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_luxury_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE canonical_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE area_demand_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY market_price_memory_staff ON market_price_memory
  FOR ALL USING (is_staff_admin());
CREATE POLICY market_luxury_zones_staff ON market_luxury_zones
  FOR ALL USING (is_staff_admin());
CREATE POLICY canonical_locations_read ON canonical_locations
  FOR SELECT USING (TRUE);
CREATE POLICY canonical_locations_staff ON canonical_locations
  FOR ALL USING (is_staff_admin());
CREATE POLICY area_demand_memory_staff ON area_demand_memory
  FOR ALL USING (is_staff_admin());

CREATE TRIGGER market_price_memory_updated_at
  BEFORE UPDATE ON market_price_memory
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER market_luxury_zones_updated_at
  BEFORE UPDATE ON market_luxury_zones
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER canonical_locations_updated_at
  BEFORE UPDATE ON canonical_locations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER area_demand_memory_updated_at
  BEFORE UPDATE ON area_demand_memory
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Bump recent duplicate interactions instead of spamming leads
CREATE OR REPLACE FUNCTION yike_bump_recent_lead_interaction(
  p_listing_id UUID,
  p_agent_id UUID,
  p_dedupe_key TEXT,
  p_lead_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing UUID;
BEGIN
  SELECT id INTO v_existing
  FROM leads
  WHERE listing_id = p_listing_id
    AND agent_id = p_agent_id
    AND dedupe_key = p_dedupe_key
    AND id <> p_lead_id
    AND created_at >= NOW() - INTERVAL '30 minutes'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_existing IS NULL THEN
    UPDATE leads
    SET
      last_interaction_at = NOW(),
      interaction_count = COALESCE(interaction_count, 1)
    WHERE id = p_lead_id;
    RETURN FALSE;
  END IF;

  UPDATE leads
  SET
    last_interaction_at = NOW(),
    interaction_count = COALESCE(interaction_count, 1) + 1
  WHERE id = v_existing;

  DELETE FROM leads WHERE id = p_lead_id;
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION yike_bump_recent_lead_interaction(uuid, uuid, text, uuid) TO service_role;
