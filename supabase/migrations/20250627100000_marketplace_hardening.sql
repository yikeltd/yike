-- Marketplace hardening: ranking signals, moderation pipeline, reports, analytics prep

-- ── Listing scoring & moderation ─────────────────────────────────────────────

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS engagement_score INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS inquiry_score INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hidden_quality_score INTEGER,
  ADD COLUMN IF NOT EXISTS moderation_state TEXT NOT NULL DEFAULT 'auto_approved',
  ADD COLUMN IF NOT EXISTS boost_level SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS boost_priority INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS boosted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS boosted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS report_review_recommended BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS soft_hold_recommended BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_moderation_state_check;
ALTER TABLE properties
  ADD CONSTRAINT properties_moderation_state_check
  CHECK (moderation_state IN (
    'auto_approved',
    'pending_review',
    'flagged',
    'under_investigation',
    'approved',
    'rejected'
  ));

CREATE INDEX IF NOT EXISTS properties_moderation_state_idx
  ON properties (moderation_state, updated_at DESC);
CREATE INDEX IF NOT EXISTS properties_expiring_idx
  ON properties (expires_at)
  WHERE status = 'approved' AND expired_at IS NULL;

-- ── Reports queue extensions ─────────────────────────────────────────────────

ALTER TABLE listing_reports
  ADD COLUMN IF NOT EXISTS reporter_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

UPDATE listing_reports SET status = 'action_taken' WHERE status = 'resolved';

ALTER TABLE listing_reports DROP CONSTRAINT IF EXISTS listing_reports_status_check;
ALTER TABLE listing_reports
  ADD CONSTRAINT listing_reports_status_check
  CHECK (status IN (
    'open',
    'pending',
    'reviewed',
    'action_taken',
    'dismissed',
    'resolved'
  ));

-- open/pending = unresolved for threshold automation
CREATE INDEX IF NOT EXISTS listing_reports_property_open_idx
  ON listing_reports (property_id, created_at DESC)
  WHERE status IN ('open', 'pending');

-- ── Report thresholds (no auto-delete) ───────────────────────────────────────

CREATE OR REPLACE FUNCTION yike_refresh_listing_report_thresholds(p_property_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_open_count INTEGER;
  v_agent_id UUID;
BEGIN
  SELECT COUNT(*) INTO v_open_count
  FROM listing_reports
  WHERE property_id = p_property_id
    AND status IN ('open', 'pending');

  SELECT agent_id INTO v_agent_id
  FROM properties
  WHERE id = p_property_id;

  UPDATE properties
  SET
    report_review_recommended = v_open_count >= 3,
    soft_hold_recommended = v_open_count >= 5,
    moderation_state = CASE
      WHEN v_open_count >= 5 AND moderation_state = 'auto_approved' THEN 'flagged'
      WHEN v_open_count >= 3 AND moderation_state = 'auto_approved' THEN 'pending_review'
      ELSE moderation_state
    END,
    updated_at = NOW()
  WHERE id = p_property_id;

  IF v_agent_id IS NOT NULL THEN
    PERFORM yike_refresh_abuse_review_flag(v_agent_id);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION handle_listing_report()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM yike_refresh_listing_report_thresholds(NEW.property_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Restore listings wrongly auto-hidden by legacy trigger (open reports only)
UPDATE properties p
SET status = 'approved'
WHERE p.status = 'hidden'
  AND EXISTS (
    SELECT 1 FROM listing_reports lr
    WHERE lr.property_id = p.id AND lr.status IN ('open', 'pending')
  )
  AND (
    SELECT COUNT(*) FROM listing_reports lr
    WHERE lr.property_id = p.id AND lr.status IN ('open', 'pending')
  ) < 5;

-- ── Lightweight analytics events ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS listing_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  city TEXT,
  state TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS listing_analytics_events_listing_idx
  ON listing_analytics_events (listing_id, created_at DESC);
CREATE INDEX IF NOT EXISTS listing_analytics_events_type_idx
  ON listing_analytics_events (event_type, created_at DESC);

ALTER TABLE listing_analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY listing_analytics_events_insert ON listing_analytics_events
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY listing_analytics_events_staff ON listing_analytics_events
  FOR SELECT USING (is_staff_admin());

-- ── Saved searches (server prep — notifications later) ─────────────────────────

CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  query_path TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  notify_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, query_path)
);

CREATE INDEX IF NOT EXISTS saved_searches_user_idx
  ON saved_searches (user_id, updated_at DESC);

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY saved_searches_own ON saved_searches
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER saved_searches_updated_at
  BEFORE UPDATE ON saved_searches
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Agent responsiveness snapshot ────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS responsiveness_score NUMERIC;
