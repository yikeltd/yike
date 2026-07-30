-- Yike Trust & Safety Engine — Pass 1: Foundation, Reporting & Risk Scoring
-- Created: 2026-07-30

-- 1. Trust Profiles Table
CREATE TABLE IF NOT EXISTS trust_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trust_status TEXT NOT NULL DEFAULT 'normal' CHECK (trust_status IN ('trusted', 'verified', 'normal', 'under_review', 'restricted', 'suspended', 'banned')),
  risk_score INT NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  trust_score INT NOT NULL DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
  verification_score INT NOT NULL DEFAULT 0 CHECK (verification_score >= 0 AND verification_score <= 100),
  identity_status TEXT NOT NULL DEFAULT 'unverified',
  report_count INT NOT NULL DEFAULT 0,
  confirmed_violations INT NOT NULL DEFAULT 0,
  dismissed_reports INT NOT NULL DEFAULT 0,
  warnings_issued INT NOT NULL DEFAULT 0,
  restrictions_count INT NOT NULL DEFAULT 0,
  suspensions_count INT NOT NULL DEFAULT 0,
  permanent_ban_flag BOOLEAN NOT NULL DEFAULT FALSE,
  appeal_status TEXT NOT NULL DEFAULT 'none' CHECK (appeal_status IN ('none', 'submitted', 'under_review', 'approved', 'rejected')),
  last_reviewed_at TIMESTAMPTZ,
  last_reviewed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS trust_profiles_user_idx ON trust_profiles (user_id);
CREATE INDEX IF NOT EXISTS trust_profiles_status_idx ON trust_profiles (trust_status);
CREATE INDEX IF NOT EXISTS trust_profiles_risk_idx ON trust_profiles (risk_score DESC);

ALTER TABLE trust_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own trust profile" ON trust_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- 2. Trust Ledger (Immutable History)
CREATE TABLE IF NOT EXISTS trust_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  risk_score_delta INT NOT NULL DEFAULT 0,
  trust_score_delta INT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS trust_ledger_user_idx ON trust_ledger (user_id, created_at DESC);

ALTER TABLE trust_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own trust ledger" ON trust_ledger
  FOR SELECT USING (auth.uid() = user_id);

-- 3. Universal User Reports
CREATE TABLE IF NOT EXISTS user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_listing_id UUID,
  reported_conversation_id TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'scam', 'fraud', 'fake_listing', 'fake_vehicle', 'fake_property', 
    'misleading_information', 'harassment', 'spam', 'impersonation', 
    'counterfeit_documents', 'inappropriate_content', 'payment_fraud', 'other'
  )),
  description TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed', 'merged')),
  assigned_moderator_id UUID,
  resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_reports_reporter_idx ON user_reports (reporter_id);
CREATE INDEX IF NOT EXISTS user_reports_reported_user_idx ON user_reports (reported_user_id);
CREATE INDEX IF NOT EXISTS user_reports_status_idx ON user_reports (status);

ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reporters view own submitted reports" ON user_reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Authenticated users submit reports" ON user_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- 4. Trust Appeals Architecture
CREATE TABLE IF NOT EXISTS trust_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id UUID REFERENCES user_reports(id) ON DELETE SET NULL,
  appeal_reason TEXT NOT NULL,
  appeal_status TEXT NOT NULL DEFAULT 'pending' CHECK (appeal_status IN ('pending', 'under_review', 'approved', 'rejected')),
  moderator_notes TEXT,
  decision TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS trust_appeals_user_idx ON trust_appeals (user_id);

ALTER TABLE trust_appeals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own trust appeals" ON trust_appeals
  FOR SELECT USING (auth.uid() = user_id);

-- 5. Trust Audit Logs
CREATE TABLE IF NOT EXISTS trust_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id UUID REFERENCES user_reports(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS trust_audit_logs_actor_idx ON trust_audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS trust_audit_logs_target_idx ON trust_audit_logs (target_user_id);

ALTER TABLE trust_audit_logs ENABLE ROW LEVEL SECURITY;
