-- Strategic trust & quality: freshness, confidence, funnel analytics, inspection prep

-- ── Agent verification hardening ─────────────────────────────────────────────

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_verification_level_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_verification_level_check
  CHECK (
    verification_level IS NULL
    OR verification_level IN (
      'basic',
      'identity_verified',
      'business_verified',
      'yike_verified',
      'yike_partner',
      'premium_partner'
    )
  );

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS reputation_score NUMERIC(6, 2),
  ADD COLUMN IF NOT EXISTS complaint_score NUMERIC(6, 2);

-- ── Listing quality / freshness / confidence ─────────────────────────────────

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS freshness_score INT,
  ADD COLUMN IF NOT EXISTS stale_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auto_archive_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confidence_score INT,
  ADD COLUMN IF NOT EXISTS image_quality_score INT,
  ADD COLUMN IF NOT EXISTS image_quality_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS inspection_available BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS inspection_requested_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS yike_inspection_eligible BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS properties_confidence_idx
  ON properties (confidence_score DESC NULLS LAST)
  WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS properties_freshness_idx
  ON properties (freshness_score DESC NULLS LAST, last_refreshed_at DESC NULLS LAST)
  WHERE status = 'approved';

-- Backfill freshness from stale_score
UPDATE properties
SET freshness_score = GREATEST(
  0,
  LEAST(100, ROUND((1 - COALESCE(stale_score, 0)) * 100))
)
WHERE freshness_score IS NULL;

UPDATE properties
SET auto_archive_at = COALESCE(auto_archive_at, auto_expire_at)
WHERE auto_archive_at IS NULL AND auto_expire_at IS NOT NULL;

-- ── Agent trust metrics extension ────────────────────────────────────────────

ALTER TABLE agent_trust_metrics
  ADD COLUMN IF NOT EXISTS reputation_score NUMERIC(6, 2),
  ADD COLUMN IF NOT EXISTS complaint_score NUMERIC(6, 2);

-- ── WhatsApp / lead funnel analytics (internal) ────────────────────────────

CREATE TABLE IF NOT EXISTS funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  listing_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  user_id UUID,
  guest_id TEXT,
  source_page TEXT,
  source_surface TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE funnel_events DROP CONSTRAINT IF EXISTS funnel_events_event_type_check;
ALTER TABLE funnel_events
  ADD CONSTRAINT funnel_events_event_type_check
  CHECK (
    event_type IN (
      'whatsapp_button_clicked',
      'whatsapp_opened',
      'lead_created',
      'handoff_shared',
      'direct_whatsapp_used',
      'direct_call_used',
      'call_button_clicked'
    )
  );

CREATE INDEX IF NOT EXISTS funnel_events_type_created_idx
  ON funnel_events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS funnel_events_listing_idx
  ON funnel_events (listing_id, created_at DESC)
  WHERE listing_id IS NOT NULL;

ALTER TABLE funnel_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS funnel_events_staff ON funnel_events;
CREATE POLICY funnel_events_staff ON funnel_events
  FOR ALL USING (is_staff_admin());

-- Bump inspection request count when a request is filed
CREATE OR REPLACE FUNCTION yike_bump_inspection_request_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE properties
  SET inspection_requested_count = COALESCE(inspection_requested_count, 0) + 1
  WHERE id = NEW.listing_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS inspection_requests_count_trg ON inspection_requests;
CREATE TRIGGER inspection_requests_count_trg
  AFTER INSERT ON inspection_requests
  FOR EACH ROW
  EXECUTE FUNCTION yike_bump_inspection_request_count();
