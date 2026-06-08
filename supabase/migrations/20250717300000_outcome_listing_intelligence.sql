-- Outcome-based listing intelligence — learns from real-world results after go-live

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS outcome_score INTEGER,
  ADD COLUMN IF NOT EXISTS outcome_evolution_delta INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS outcome_signals JSONB,
  ADD COLUMN IF NOT EXISTS outcome_updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS properties_outcome_score_idx
  ON properties (outcome_score DESC NULLS LAST)
  WHERE status = 'approved';

-- Append-only outcome observations (internal)
CREATE TABLE IF NOT EXISTS outcome_learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  signal_weight INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS outcome_learning_events_entity_idx
  ON outcome_learning_events (entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS outcome_learning_events_signal_idx
  ON outcome_learning_events (signal_type, created_at DESC);

-- Agent quality memory from outcomes over time
CREATE TABLE IF NOT EXISTS agent_outcome_memory (
  agent_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  quality_score INTEGER NOT NULL DEFAULT 50,
  review_strictness_modifier INTEGER NOT NULL DEFAULT 0,
  positive_signal_count INTEGER NOT NULL DEFAULT 0,
  negative_signal_count INTEGER NOT NULL DEFAULT 0,
  outcome_summary JSONB NOT NULL DEFAULT '{}',
  last_calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Area / market outcome memory (fraud zones, trusted zones, pricing realism)
CREATE TABLE IF NOT EXISTS area_outcome_memory (
  area_key TEXT PRIMARY KEY,
  state TEXT NOT NULL,
  city TEXT,
  area TEXT,
  fraud_risk_score INTEGER NOT NULL DEFAULT 0,
  trust_zone_score INTEGER NOT NULL DEFAULT 50,
  pricing_realism_score INTEGER NOT NULL DEFAULT 50,
  complaint_rate NUMERIC(8, 4) NOT NULL DEFAULT 0,
  engagement_rate NUMERIC(8, 4) NOT NULL DEFAULT 0,
  listing_sample_count INTEGER NOT NULL DEFAULT 0,
  outcome_summary JSONB NOT NULL DEFAULT '{}',
  last_calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS area_outcome_memory_lookup_idx
  ON area_outcome_memory (state, city, area);

ALTER TABLE outcome_learning_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_outcome_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE area_outcome_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY outcome_learning_events_staff ON outcome_learning_events
  FOR ALL USING (is_staff_admin());

CREATE POLICY agent_outcome_memory_staff ON agent_outcome_memory
  FOR ALL USING (is_staff_admin());

CREATE POLICY area_outcome_memory_staff ON area_outcome_memory
  FOR ALL USING (is_staff_admin());
