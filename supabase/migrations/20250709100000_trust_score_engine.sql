-- Internal trust score engine — operational intelligence (staff-only)

CREATE TABLE IF NOT EXISTS trust_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  trust_score NUMERIC(6, 2) NOT NULL DEFAULT 50,
  risk_score NUMERIC(6, 2) NOT NULL DEFAULT 0,
  confidence_score NUMERIC(6, 2) NOT NULL DEFAULT 0,
  trust_level TEXT NOT NULL DEFAULT 'neutral',
  event_count INTEGER NOT NULL DEFAULT 0,
  score_frozen BOOLEAN NOT NULL DEFAULT FALSE,
  manual_trust_score NUMERIC(6, 2),
  manual_risk_score NUMERIC(6, 2),
  manual_trust_level TEXT,
  escalated BOOLEAN NOT NULL DEFAULT FALSE,
  admin_notes TEXT,
  last_calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entity_type, entity_id)
);

ALTER TABLE trust_scores DROP CONSTRAINT IF EXISTS trust_scores_entity_type_check;
ALTER TABLE trust_scores
  ADD CONSTRAINT trust_scores_entity_type_check
  CHECK (entity_type IN ('agent', 'company', 'listing', 'field_verifier', 'legal_partner'));

ALTER TABLE trust_scores DROP CONSTRAINT IF EXISTS trust_scores_trust_level_check;
ALTER TABLE trust_scores
  ADD CONSTRAINT trust_scores_trust_level_check
  CHECK (trust_level IN (
    'critical_risk', 'high_risk', 'elevated_risk', 'neutral',
    'trusted', 'highly_trusted', 'elite'
  ));

CREATE INDEX IF NOT EXISTS trust_scores_level_idx ON trust_scores (trust_level);
CREATE INDEX IF NOT EXISTS trust_scores_risk_idx ON trust_scores (risk_score DESC);
CREATE INDEX IF NOT EXISTS trust_scores_trust_idx ON trust_scores (trust_score DESC);
CREATE INDEX IF NOT EXISTS trust_scores_escalated_idx ON trust_scores (escalated) WHERE escalated = TRUE;

CREATE TABLE IF NOT EXISTS trust_score_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  score_delta NUMERIC(6, 2) NOT NULL DEFAULT 0,
  risk_delta NUMERIC(6, 2) NOT NULL DEFAULT 0,
  confidence_delta NUMERIC(6, 2) NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE trust_score_events DROP CONSTRAINT IF EXISTS trust_score_events_entity_type_check;
ALTER TABLE trust_score_events
  ADD CONSTRAINT trust_score_events_entity_type_check
  CHECK (entity_type IN ('agent', 'company', 'listing', 'field_verifier', 'legal_partner'));

CREATE INDEX IF NOT EXISTS trust_score_events_entity_idx
  ON trust_score_events (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS trust_score_events_type_idx
  ON trust_score_events (event_type, created_at DESC);

-- Lightweight cached summaries for ranking (internal — never public UI)
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS internal_trust_score NUMERIC(6, 2) NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS internal_risk_score NUMERIC(6, 2) NOT NULL DEFAULT 0;

ALTER TABLE trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_score_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS trust_scores_staff ON trust_scores;
CREATE POLICY trust_scores_staff ON trust_scores FOR ALL USING (is_staff_admin());

DROP POLICY IF EXISTS trust_score_events_staff ON trust_score_events;
CREATE POLICY trust_score_events_staff ON trust_score_events FOR ALL USING (is_staff_admin());

DROP TRIGGER IF EXISTS trust_scores_updated_at ON trust_scores;
CREATE TRIGGER trust_scores_updated_at
  BEFORE UPDATE ON trust_scores
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
