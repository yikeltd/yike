-- Moderated agent/company reviews, replies, reports, agent status, platform settings

CREATE TYPE review_status AS ENUM (
  'pending', 'approved', 'rejected', 'hidden', 'flagged'
);

CREATE TYPE reply_status AS ENUM (
  'pending', 'approved', 'rejected', 'hidden'
);

CREATE TYPE agent_profile_status AS ENUM (
  'active', 'suspended', 'deleted', 'reinstated'
);

CREATE TYPE verification_call_status AS ENUM (
  'not_scheduled', 'scheduled', 'completed', 'missed', 'failed'
);

CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

INSERT INTO platform_settings (key, value)
VALUES ('review_publishing_mode', '"manual_review"')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS agent_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  body TEXT NOT NULL CHECK (char_length(body) >= 10 AND char_length(body) <= 1000),
  status review_status NOT NULL DEFAULT 'pending',
  moderation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT agent_reviews_target_check CHECK (
    agent_id IS NOT NULL OR company_id IS NOT NULL
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS agent_reviews_one_per_user_agent
  ON agent_reviews (reviewer_id, agent_id)
  WHERE agent_id IS NOT NULL AND status NOT IN ('rejected', 'hidden');

CREATE UNIQUE INDEX IF NOT EXISTS agent_reviews_one_per_user_company
  ON agent_reviews (reviewer_id, company_id)
  WHERE company_id IS NOT NULL AND status NOT IN ('rejected', 'hidden');

CREATE INDEX IF NOT EXISTS agent_reviews_agent_status_idx
  ON agent_reviews (agent_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS agent_reviews_company_status_idx
  ON agent_reviews (company_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS agent_reviews_status_idx
  ON agent_reviews (status, created_at DESC);

CREATE TABLE IF NOT EXISTS review_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES agent_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) >= 1 AND char_length(body) <= 500),
  status reply_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS review_replies_review_idx
  ON review_replies (review_id, status, created_at);

CREATE TABLE IF NOT EXISTS review_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES agent_reviews(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS review_reports_review_idx
  ON review_reports (review_id, status);

CREATE TABLE IF NOT EXISTS agent_status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  reason TEXT,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agent_status_logs_agent_idx
  ON agent_status_logs (agent_id, created_at DESC);

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS profile_status agent_profile_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS profile_status_reason TEXT,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE agent_verifications
  ADD COLUMN IF NOT EXISTS verification_call_status verification_call_status NOT NULL DEFAULT 'not_scheduled',
  ADD COLUMN IF NOT EXISTS verification_call_url TEXT,
  ADD COLUMN IF NOT EXISTS verification_call_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_notes TEXT,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- RLS
ALTER TABLE agent_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Public: read approved reviews only
CREATE POLICY agent_reviews_public_select ON agent_reviews
  FOR SELECT USING (status = 'approved');

CREATE POLICY agent_reviews_insert_own ON agent_reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY agent_reviews_select_own ON agent_reviews
  FOR SELECT USING (auth.uid() = reviewer_id);

CREATE POLICY agent_reviews_admin_all ON agent_reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin', 'moderator')
        AND p.is_banned = FALSE
    )
  );

CREATE POLICY review_replies_public_select ON review_replies
  FOR SELECT USING (status = 'approved');

CREATE POLICY review_replies_insert_own ON review_replies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY review_replies_select_own ON review_replies
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY review_replies_admin_all ON review_replies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin', 'moderator')
        AND p.is_banned = FALSE
    )
  );

CREATE POLICY review_reports_insert_own ON review_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY review_reports_admin_select ON review_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin', 'moderator', 'support')
        AND p.is_banned = FALSE
    )
  );

CREATE POLICY agent_status_logs_admin ON agent_status_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin', 'moderator')
        AND p.is_banned = FALSE
    )
  );

CREATE POLICY platform_settings_admin ON platform_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
        AND p.is_banned = FALSE
    )
  );

CREATE POLICY platform_settings_public_read ON platform_settings
  FOR SELECT USING (key = 'review_publishing_mode');

-- Agents can read reviews about themselves (all statuses for dashboard)
CREATE POLICY agent_reviews_agent_self ON agent_reviews
  FOR SELECT USING (
    auth.uid() = agent_id OR auth.uid() = company_id
  );

CREATE POLICY review_replies_agent_on_own_review ON review_replies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM agent_reviews r
      WHERE r.id = review_id
        AND (r.agent_id = auth.uid() OR r.company_id = auth.uid())
    )
  );
