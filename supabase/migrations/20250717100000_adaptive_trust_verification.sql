-- Adaptive trust & phased verification (levels 0–5)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS adaptive_trust_level SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS adaptive_trust_override SMALLINT,
  ADD COLUMN IF NOT EXISTS verification_escalation_reason TEXT,
  ADD COLUMN IF NOT EXISTS verification_escalated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_escalated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS listing_rules_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_resolved_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS bank_verified_at TIMESTAMPTZ;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_adaptive_trust_level_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_adaptive_trust_level_check
  CHECK (adaptive_trust_level BETWEEN 0 AND 5);

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_adaptive_trust_override_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_adaptive_trust_override_check
  CHECK (adaptive_trust_override IS NULL OR adaptive_trust_override BETWEEN 0 AND 5);

CREATE INDEX IF NOT EXISTS profiles_adaptive_trust_level_idx
  ON profiles (adaptive_trust_level)
  WHERE adaptive_trust_level >= 4 OR verification_required = TRUE;

-- Global verification toggles (singleton)
CREATE TABLE IF NOT EXISTS verification_control_config (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE,
  email_verification_required BOOLEAN NOT NULL DEFAULT TRUE,
  whatsapp_verification_required BOOLEAN NOT NULL DEFAULT TRUE,
  bank_verification_required BOOLEAN NOT NULL DEFAULT FALSE,
  listing_review_required BOOLEAN NOT NULL DEFAULT TRUE,
  verified_badge_required BOOLEAN NOT NULL DEFAULT TRUE,
  enhanced_review_required BOOLEAN NOT NULL DEFAULT FALSE,
  company_verification_required BOOLEAN NOT NULL DEFAULT FALSE,
  cac_verification_required BOOLEAN NOT NULL DEFAULT FALSE,
  id_verification_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  selfie_verification_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  auto_escalation_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT verification_control_config_singleton CHECK (id = TRUE)
);

INSERT INTO verification_control_config (id) VALUES (TRUE) ON CONFLICT (id) DO NOTHING;

-- Human trust review queue
CREATE TABLE IF NOT EXISTS trust_review_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_reference TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  case_type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'open',
  suspicion_score INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  signals JSONB NOT NULL DEFAULT '{}'::jsonb,
  required_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  admin_notes TEXT,
  linked_accounts JSONB NOT NULL DEFAULT '[]'::jsonb,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  opened_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolution_action TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE trust_review_cases DROP CONSTRAINT IF EXISTS trust_review_cases_status_check;
ALTER TABLE trust_review_cases
  ADD CONSTRAINT trust_review_cases_status_check
  CHECK (status IN ('open', 'in_review', 'resolved', 'dismissed'));

ALTER TABLE trust_review_cases DROP CONSTRAINT IF EXISTS trust_review_cases_priority_check;
ALTER TABLE trust_review_cases
  ADD CONSTRAINT trust_review_cases_priority_check
  CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

ALTER TABLE trust_review_cases DROP CONSTRAINT IF EXISTS trust_review_cases_type_check;
ALTER TABLE trust_review_cases
  ADD CONSTRAINT trust_review_cases_type_check
  CHECK (case_type IN (
    'escalated_user', 'suspicious_listing', 'complaint_pattern', 'multi_account',
    'failed_verification', 'suspicious_pricing', 'duplicate_media', 'device_anomaly', 'manual'
  ));

CREATE INDEX IF NOT EXISTS trust_review_cases_queue_idx
  ON trust_review_cases (status, priority, suspicion_score DESC, created_at DESC);

-- Private admin trust notes
CREATE TABLE IF NOT EXISTS trust_admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS trust_admin_notes_user_idx
  ON trust_admin_notes (user_id, created_at DESC);

-- RLS
ALTER TABLE verification_control_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_review_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_admin_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS verification_control_config_staff ON verification_control_config;
CREATE POLICY verification_control_config_staff ON verification_control_config
  FOR ALL USING (is_staff_admin());

DROP POLICY IF EXISTS trust_review_cases_staff ON trust_review_cases;
CREATE POLICY trust_review_cases_staff ON trust_review_cases
  FOR ALL USING (is_staff_admin());

DROP POLICY IF EXISTS trust_admin_notes_staff ON trust_admin_notes;
CREATE POLICY trust_admin_notes_staff ON trust_admin_notes
  FOR ALL USING (is_staff_admin());

DROP TRIGGER IF EXISTS trust_review_cases_updated_at ON trust_review_cases;
CREATE TRIGGER trust_review_cases_updated_at
  BEFORE UPDATE ON trust_review_cases
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS verification_control_config_updated_at ON verification_control_config;
CREATE TRIGGER verification_control_config_updated_at
  BEFORE UPDATE ON verification_control_config
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
