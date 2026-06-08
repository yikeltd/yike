-- Intelligent review memory — Nigerian-market-aware listing judgment

-- Cached review scores on properties (staff-only, never public)
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS review_overall_score INTEGER,
  ADD COLUMN IF NOT EXISTS review_risk_level TEXT,
  ADD COLUMN IF NOT EXISTS review_suggested_action TEXT,
  ADD COLUMN IF NOT EXISTS review_queue_group TEXT,
  ADD COLUMN IF NOT EXISTS review_scores JSONB,
  ADD COLUMN IF NOT EXISTS review_scores_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_visibility_modifier INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS review_hold_status TEXT NOT NULL DEFAULT 'none';

CREATE INDEX IF NOT EXISTS properties_review_queue_group_idx
  ON properties (review_queue_group, status)
  WHERE review_queue_group IS NOT NULL;

CREATE INDEX IF NOT EXISTS properties_review_overall_idx
  ON properties (review_overall_score DESC NULLS LAST)
  WHERE status = 'pending';

-- Admin decision memory — learns from past judgments
CREATE TABLE IF NOT EXISTS listing_review_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  decision_type TEXT NOT NULL,
  decision_reason TEXT,
  signals JSONB NOT NULL DEFAULT '{}',
  property_type TEXT,
  listing_type TEXT,
  scores_snapshot JSONB,
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS listing_review_memory_listing_idx
  ON listing_review_memory (listing_id, created_at DESC);

CREATE INDEX IF NOT EXISTS listing_review_memory_agent_idx
  ON listing_review_memory (agent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS listing_review_memory_decision_idx
  ON listing_review_memory (decision_type, created_at DESC);

-- Admin update/explanation requests
CREATE TABLE IF NOT EXISTS listing_review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolution_action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS listing_review_requests_listing_idx
  ON listing_review_requests (listing_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS listing_review_requests_agent_idx
  ON listing_review_requests (agent_id, status, created_at DESC);

-- Agent responses to review requests
CREATE TABLE IF NOT EXISTS listing_review_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES listing_review_requests(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  evidence_urls JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS listing_review_responses_request_idx
  ON listing_review_responses (request_id, created_at DESC);

ALTER TABLE listing_review_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_review_responses ENABLE ROW LEVEL SECURITY;

-- Staff read/write via service role; agents read own requests
CREATE POLICY listing_review_requests_agent_select ON listing_review_requests
  FOR SELECT USING (auth.uid() = agent_id);

CREATE POLICY listing_review_responses_agent_insert ON listing_review_responses
  FOR INSERT WITH CHECK (auth.uid() = agent_id);

CREATE POLICY listing_review_responses_agent_select ON listing_review_responses
  FOR SELECT USING (auth.uid() = agent_id);
