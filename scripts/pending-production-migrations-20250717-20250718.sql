-- Yike production migrations (20250717* + 20250718*) — run in order in SQL Editor.
-- Project: hlpojfurfldvcxfxhveg
--
-- If you see: relation "verification_control_config" does not exist
--   → you skipped section 1 (20250717100000). Run from the top.
--
-- Safe to re-run: most statements use IF NOT EXISTS / ON CONFLICT DO NOTHING.


-- ===== 20250717100000_adaptive_trust_verification.sql =====
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

-- ===== 20250717200000_intelligent_review_memory.sql =====
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

-- ===== 20250717300000_outcome_listing_intelligence.sql =====
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

-- ===== 20250718100000_verification_control_expansion.sql =====
-- Verification control expansion: toggles, permissions, status states
-- Depends on verification_control_config from 20250717100000_adaptive_trust_verification.sql

-- Bootstrap singleton table if an older prod skipped 20250717100000 (idempotent)
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

ALTER TABLE verification_control_config
  ADD COLUMN IF NOT EXISTS listing_verification_required BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS device_abuse_monitoring_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS multi_account_detection_enabled BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS verification_state TEXT NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS required_verification_tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS operational_suspicion_score INTEGER NOT NULL DEFAULT 0;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_verification_state_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_verification_state_check
  CHECK (verification_state IN (
    'unverified',
    'partially_verified',
    'verified_contact',
    'verified_listing',
    'verified_agent',
    'verified_company',
    'enhanced_review_required',
    'restricted',
    'suspended'
  ));

CREATE TABLE IF NOT EXISTS verification_control_permissions (
  staff_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  can_manage_verification_control BOOLEAN NOT NULL DEFAULT TRUE,
  can_enforce_trust BOOLEAN NOT NULL DEFAULT TRUE,
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assignment_notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE verification_control_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS verification_control_permissions_staff ON verification_control_permissions;
CREATE POLICY verification_control_permissions_staff ON verification_control_permissions
  FOR ALL USING (is_staff_admin());

DROP TRIGGER IF EXISTS verification_control_permissions_updated_at ON verification_control_permissions;
CREATE TRIGGER verification_control_permissions_updated_at
  BEFORE UPDATE ON verification_control_permissions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ===== 20250718120000_email_ad_placement.sql =====
-- Transactional email sponsor slot — manage at /lex/auth/email-ads

INSERT INTO ad_placements (placement_key, label) VALUES
  ('email_transactional', 'Transactional email — under headline')
ON CONFLICT (placement_key) DO NOTHING;

-- ===== 20250718130000_ad_creatives_bucket.sql =====
-- Public bucket for admin-uploaded ad creatives (email chips, website ads)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ad-creatives',
  'ad-creatives',
  TRUE,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read ad creatives" ON storage.objects;
CREATE POLICY "Public read ad creatives"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'ad-creatives');

-- Staff uploads via console; service role API also bypasses RLS for /api/admin/ads/upload-image
DROP POLICY IF EXISTS "Staff upload ad creatives" ON storage.objects;
CREATE POLICY "Staff upload ad creatives"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ad-creatives' AND is_staff_admin());

DROP POLICY IF EXISTS "Staff update ad creatives" ON storage.objects;
CREATE POLICY "Staff update ad creatives"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'ad-creatives' AND is_staff_admin())
  WITH CHECK (bucket_id = 'ad-creatives' AND is_staff_admin());

DROP POLICY IF EXISTS "Staff delete ad creatives" ON storage.objects;
CREATE POLICY "Staff delete ad creatives"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'ad-creatives' AND is_staff_admin());

-- ===== 20250718140000_operational_audit_safety.sql =====
-- Operational audit logging extensions, safe support view, soft-delete columns

-- ── Audit log enrichment ──────────────────────────────────────────────────────

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS actor_name TEXT,
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS target_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS target_user_name TEXT,
  ADD COLUMN IF NOT EXISTS reason TEXT,
  ADD COLUMN IF NOT EXISTS route TEXT,
  ADD COLUMN IF NOT EXISTS user_agent_hash TEXT,
  ADD COLUMN IF NOT EXISTS risk_level TEXT NOT NULL DEFAULT 'low'
    CHECK (risk_level IN ('low', 'medium', 'high', 'critical'));

CREATE INDEX IF NOT EXISTS audit_logs_summary_idx
  ON audit_logs (created_at DESC)
  WHERE summary IS NOT NULL;

CREATE INDEX IF NOT EXISTS audit_logs_target_user_idx
  ON audit_logs (target_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_risk_idx
  ON audit_logs (risk_level, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_reason_idx
  ON audit_logs (created_at DESC)
  WHERE reason IS NOT NULL;

-- ── Safe support view permissions ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS account_view_permissions (
  profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  can_view_accounts BOOLEAN NOT NULL DEFAULT FALSE,
  granted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

ALTER TABLE account_view_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY account_view_permissions_admin_select ON account_view_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
        AND p.is_banned = FALSE
    )
  );

CREATE POLICY account_view_permissions_admin_write ON account_view_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
        AND p.is_banned = FALSE
    )
  );

CREATE TABLE IF NOT EXISTS support_view_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  read_only BOOLEAN NOT NULL DEFAULT TRUE,
  route TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  end_reason TEXT
);

CREATE INDEX IF NOT EXISTS support_view_sessions_admin_idx
  ON support_view_sessions (admin_id, started_at DESC);

CREATE INDEX IF NOT EXISTS support_view_sessions_target_idx
  ON support_view_sessions (target_user_id, started_at DESC);

ALTER TABLE support_view_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY support_view_sessions_admin ON support_view_sessions
  FOR ALL USING (
    admin_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
        AND p.is_banned = FALSE
    )
  );

-- ── Soft-delete / archive columns ─────────────────────────────────────────────

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archive_reason TEXT;

CREATE INDEX IF NOT EXISTS properties_archived_idx
  ON properties (archived_at DESC)
  WHERE archived_at IS NOT NULL;

ALTER TABLE site_banners
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE home_hot_picks
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE ad_placements
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- ===== 20250718150000_staff_work_assignments.sql =====
-- Staff work assignments for role-based APK routing

CREATE TABLE IF NOT EXISTS staff_work_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  work_area TEXT NOT NULL CHECK (work_area IN (
    'command_center',
    'support',
    'listing_review',
    'trust_review',
    'verification',
    'ambassadors',
    'legal_partners',
    'deal_matching',
    'tech'
  )),
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  priority INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (staff_id, work_area)
);

CREATE INDEX IF NOT EXISTS staff_work_assignments_staff_idx
  ON staff_work_assignments (staff_id, is_active, priority DESC);

ALTER TABLE staff_work_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_work_assignments_admin_select ON staff_work_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY staff_work_assignments_admin_write ON staff_work_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY staff_work_assignments_self_read ON staff_work_assignments
  FOR SELECT USING (staff_id = auth.uid());

DROP TRIGGER IF EXISTS staff_work_assignments_updated_at ON staff_work_assignments;
CREATE TRIGGER staff_work_assignments_updated_at
  BEFORE UPDATE ON staff_work_assignments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ===== 20250718160000_agent_documents_bucket.sql =====
-- agent-documents bucket (verification selfies, KYC uploads) — required by POST /api/agent/verification/selfie

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agent-documents',
  'agent-documents',
  FALSE,
  15728640,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Staff manage agent verification documents
DROP POLICY IF EXISTS "Staff manage agent documents" ON storage.objects;
CREATE POLICY "Staff manage agent documents"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'agent-documents' AND is_staff_admin())
  WITH CHECK (bucket_id = 'agent-documents' AND is_staff_admin());
