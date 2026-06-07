-- Trust infrastructure hardening — timelines, risk, escalations, watchlists, disputes prep

-- Internal property trust status (never shown publicly with dangerous labels)
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS internal_trust_status TEXT NOT NULL DEFAULT 'normal';

ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_internal_trust_status_check;
ALTER TABLE properties
  ADD CONSTRAINT properties_internal_trust_status_check
  CHECK (internal_trust_status IN (
    'normal', 'physically_reviewed', 'legal_review_requested',
    'under_investigation', 'suspicious', 'high_risk', 'removed'
  ));

CREATE INDEX IF NOT EXISTS properties_internal_trust_status_idx
  ON properties (internal_trust_status)
  WHERE internal_trust_status <> 'normal';

-- Case timeline (internal chronological activity)
CREATE TABLE IF NOT EXISTS trust_case_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_type TEXT NOT NULL,
  case_id UUID NOT NULL,
  case_reference TEXT,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_role TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE trust_case_timeline DROP CONSTRAINT IF EXISTS trust_case_timeline_case_type_check;
ALTER TABLE trust_case_timeline
  ADD CONSTRAINT trust_case_timeline_case_type_check
  CHECK (case_type IN (
    'property_verification', 'legal_verification', 'property', 'agent', 'company', 'escalation'
  ));

CREATE INDEX IF NOT EXISTS trust_case_timeline_case_idx
  ON trust_case_timeline (case_type, case_id, created_at DESC);
CREATE INDEX IF NOT EXISTS trust_case_timeline_ref_idx
  ON trust_case_timeline (case_reference)
  WHERE case_reference IS NOT NULL;

-- Internal risk assessments (never public)
CREATE TABLE IF NOT EXISTS trust_risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  entity_reference TEXT,
  risk_level TEXT NOT NULL DEFAULT 'low',
  risk_score NUMERIC(6, 2) NOT NULL DEFAULT 0,
  signals JSONB NOT NULL DEFAULT '[]'::jsonb,
  assessed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE trust_risk_assessments DROP CONSTRAINT IF EXISTS trust_risk_assessments_level_check;
ALTER TABLE trust_risk_assessments
  ADD CONSTRAINT trust_risk_assessments_level_check
  CHECK (risk_level IN ('low', 'moderate', 'elevated', 'high', 'critical'));

ALTER TABLE trust_risk_assessments DROP CONSTRAINT IF EXISTS trust_risk_assessments_entity_check;
ALTER TABLE trust_risk_assessments
  ADD CONSTRAINT trust_risk_assessments_entity_check
  CHECK (entity_type IN (
    'property_verification_request', 'legal_verification_request',
    'property', 'agent', 'company', 'verifier', 'legal_partner'
  ));

CREATE UNIQUE INDEX IF NOT EXISTS trust_risk_assessments_entity_unique
  ON trust_risk_assessments (entity_type, entity_id);

-- Verification disputes (architecture prep — no full arbitration)
CREATE TABLE IF NOT EXISTS verification_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_reference TEXT NOT NULL UNIQUE,
  case_type TEXT NOT NULL,
  case_id UUID NOT NULL,
  requester_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  dispute_type TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE verification_disputes DROP CONSTRAINT IF EXISTS verification_disputes_status_check;
ALTER TABLE verification_disputes
  ADD CONSTRAINT verification_disputes_status_check
  CHECK (status IN ('submitted', 'under_review', 'escalated', 'resolved', 'dismissed'));

ALTER TABLE verification_disputes DROP CONSTRAINT IF EXISTS verification_disputes_type_check;
ALTER TABLE verification_disputes
  ADD CONSTRAINT verification_disputes_type_check
  CHECK (dispute_type IN (
    'false_report', 'misleading_inspection', 'fake_observations',
    'suspicious_legal_feedback', 'other'
  ));

-- Escalations
CREATE TABLE IF NOT EXISTS trust_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escalation_reference TEXT NOT NULL UNIQUE,
  source_case_type TEXT NOT NULL,
  source_case_id UUID NOT NULL,
  source_reference TEXT,
  escalation_type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'open',
  reason TEXT NOT NULL,
  requested_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  admin_notes TEXT,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  opened_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE trust_escalations DROP CONSTRAINT IF EXISTS trust_escalations_status_check;
ALTER TABLE trust_escalations
  ADD CONSTRAINT trust_escalations_status_check
  CHECK (status IN ('open', 'in_progress', 'resolved', 'dismissed'));

ALTER TABLE trust_escalations DROP CONSTRAINT IF EXISTS trust_escalations_type_check;
ALTER TABLE trust_escalations
  ADD CONSTRAINT trust_escalations_type_check
  CHECK (escalation_type IN (
    'suspicious_verifier_report', 'suspicious_legal_review', 'buyer_dispute',
    'fraud_concern', 'reinspection', 'secondary_legal_review',
    'hold_listing', 'freeze_agent', 'freeze_company'
  ));

-- Internal blacklist (verifiers, legal partners, agents, companies)
CREATE TABLE IF NOT EXISTS trust_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  entity_label TEXT,
  reason TEXT NOT NULL,
  reason_code TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  payouts_frozen BOOLEAN NOT NULL DEFAULT FALSE,
  assignments_blocked BOOLEAN NOT NULL DEFAULT TRUE,
  added_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  removed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  removed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE trust_blacklist DROP CONSTRAINT IF EXISTS trust_blacklist_entity_check;
ALTER TABLE trust_blacklist
  ADD CONSTRAINT trust_blacklist_entity_check
  CHECK (entity_type IN ('verifier', 'legal_partner', 'agent', 'company', 'buyer'));

CREATE INDEX IF NOT EXISTS trust_blacklist_active_idx
  ON trust_blacklist (entity_type, entity_id)
  WHERE active = TRUE;

-- Internal fraud watchlist
CREATE TABLE IF NOT EXISTS trust_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_label TEXT NOT NULL,
  watch_reason TEXT NOT NULL,
  risk_level TEXT NOT NULL DEFAULT 'moderate',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  added_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE trust_watchlist DROP CONSTRAINT IF EXISTS trust_watchlist_entity_check;
ALTER TABLE trust_watchlist
  ADD CONSTRAINT trust_watchlist_entity_check
  CHECK (entity_type IN ('agent', 'company', 'buyer', 'verifier', 'legal_partner'));

CREATE INDEX IF NOT EXISTS trust_watchlist_active_idx
  ON trust_watchlist (entity_type, active);

-- Agent / company trust history events
CREATE TABLE IF NOT EXISTS agent_trust_history_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  summary TEXT NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agent_trust_history_profile_idx
  ON agent_trust_history_events (profile_id, created_at DESC);

-- Suspicious property flags (admin queue — no auto-ban)
CREATE TABLE IF NOT EXISTS suspicious_property_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  flag_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'moderate',
  status TEXT NOT NULL DEFAULT 'pending',
  detail TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE suspicious_property_flags DROP CONSTRAINT IF EXISTS suspicious_property_flags_status_check;
ALTER TABLE suspicious_property_flags
  ADD CONSTRAINT suspicious_property_flags_status_check
  CHECK (status IN ('pending', 'reviewed', 'dismissed', 'escalated'));

-- Trust program config (premium services + escrow prep — internal)
CREATE TABLE IF NOT EXISTS trust_program_config (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE,
  premium_services JSONB NOT NULL DEFAULT '[]'::jsonb,
  escrow_prep_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  diaspora_priority_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  smart_assignment_hints BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT trust_program_config_singleton CHECK (id = TRUE)
);

INSERT INTO trust_program_config (id, premium_services) VALUES (
  TRUE,
  '[
    {"id":"express_inspection","label":"Express inspection","phase":2,"public":false},
    {"id":"diaspora_verification","label":"Diaspora verification","phase":2,"public":false},
    {"id":"priority_review","label":"Priority review","phase":2,"public":false},
    {"id":"same_day_verification","label":"Same-day verification","phase":3,"public":false},
    {"id":"executive_package","label":"Executive verification package","phase":3,"public":false},
    {"id":"combined_legal_physical","label":"Combined legal + physical","phase":3,"public":false}
  ]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Extend property verification requests
ALTER TABLE property_verification_requests
  ADD COLUMN IF NOT EXISTS internal_risk_level TEXT NOT NULL DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS assignment_caution_notes TEXT,
  ADD COLUMN IF NOT EXISTS assignment_urgency TEXT,
  ADD COLUMN IF NOT EXISTS assignment_instructions TEXT,
  ADD COLUMN IF NOT EXISTS reinspection_requested BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reinspection_of_request_id UUID REFERENCES property_verification_requests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS escalation_id UUID REFERENCES trust_escalations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS diaspora_priority BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS premium_service_id TEXT;

ALTER TABLE property_verification_requests DROP CONSTRAINT IF EXISTS property_verification_requests_risk_check;
ALTER TABLE property_verification_requests
  ADD CONSTRAINT property_verification_requests_risk_check
  CHECK (internal_risk_level IN ('low', 'moderate', 'elevated', 'high', 'critical'));

-- Extend legal verification requests
ALTER TABLE legal_verification_requests
  ADD COLUMN IF NOT EXISTS internal_risk_level TEXT NOT NULL DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS assignment_caution_notes TEXT,
  ADD COLUMN IF NOT EXISTS assignment_urgency TEXT,
  ADD COLUMN IF NOT EXISTS assignment_instructions TEXT,
  ADD COLUMN IF NOT EXISTS escalation_id UUID REFERENCES trust_escalations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS diaspora_priority BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS premium_service_id TEXT;

ALTER TABLE legal_verification_requests DROP CONSTRAINT IF EXISTS legal_verification_requests_risk_check;
ALTER TABLE legal_verification_requests
  ADD CONSTRAINT legal_verification_requests_risk_check
  CHECK (internal_risk_level IN ('low', 'moderate', 'elevated', 'high', 'critical'));

-- Future trust badges prep (admin-granted only)
CREATE TABLE IF NOT EXISTS trust_badge_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  badge_type TEXT NOT NULL,
  granted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  admin_notes TEXT,
  UNIQUE (entity_type, entity_id, badge_type)
);

ALTER TABLE trust_badge_grants DROP CONSTRAINT IF EXISTS trust_badge_grants_badge_check;
ALTER TABLE trust_badge_grants
  ADD CONSTRAINT trust_badge_grants_badge_check
  CHECK (badge_type IN (
    'physically_reviewed', 'verification_requested',
    'legal_review_available', 'trusted_agent', 'trusted_company'
  ));

-- RLS — staff only for all trust tables
ALTER TABLE trust_case_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_trust_history_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspicious_property_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_program_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_badge_grants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS trust_case_timeline_staff ON trust_case_timeline;
CREATE POLICY trust_case_timeline_staff ON trust_case_timeline FOR ALL USING (is_staff_admin());

DROP POLICY IF EXISTS trust_risk_assessments_staff ON trust_risk_assessments;
CREATE POLICY trust_risk_assessments_staff ON trust_risk_assessments FOR ALL USING (is_staff_admin());

DROP POLICY IF EXISTS verification_disputes_staff ON verification_disputes;
CREATE POLICY verification_disputes_staff ON verification_disputes FOR ALL USING (is_staff_admin());

DROP POLICY IF EXISTS trust_escalations_staff ON trust_escalations;
CREATE POLICY trust_escalations_staff ON trust_escalations FOR ALL USING (is_staff_admin());

DROP POLICY IF EXISTS trust_blacklist_staff ON trust_blacklist;
CREATE POLICY trust_blacklist_staff ON trust_blacklist FOR ALL USING (is_staff_admin());

DROP POLICY IF EXISTS trust_watchlist_staff ON trust_watchlist;
CREATE POLICY trust_watchlist_staff ON trust_watchlist FOR ALL USING (is_staff_admin());

DROP POLICY IF EXISTS agent_trust_history_staff ON agent_trust_history_events;
CREATE POLICY agent_trust_history_staff ON agent_trust_history_events FOR ALL USING (is_staff_admin());

DROP POLICY IF EXISTS suspicious_property_flags_staff ON suspicious_property_flags;
CREATE POLICY suspicious_property_flags_staff ON suspicious_property_flags FOR ALL USING (is_staff_admin());

DROP POLICY IF EXISTS trust_program_config_staff ON trust_program_config;
CREATE POLICY trust_program_config_staff ON trust_program_config FOR ALL USING (is_staff_admin());

DROP POLICY IF EXISTS trust_badge_grants_staff ON trust_badge_grants;
CREATE POLICY trust_badge_grants_staff ON trust_badge_grants FOR ALL USING (is_staff_admin());

DROP TRIGGER IF EXISTS trust_risk_assessments_updated_at ON trust_risk_assessments;
CREATE TRIGGER trust_risk_assessments_updated_at BEFORE UPDATE ON trust_risk_assessments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS verification_disputes_updated_at ON verification_disputes;
CREATE TRIGGER verification_disputes_updated_at BEFORE UPDATE ON verification_disputes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trust_escalations_updated_at ON trust_escalations;
CREATE TRIGGER trust_escalations_updated_at BEFORE UPDATE ON trust_escalations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trust_blacklist_updated_at ON trust_blacklist;
CREATE TRIGGER trust_blacklist_updated_at BEFORE UPDATE ON trust_blacklist FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trust_watchlist_updated_at ON trust_watchlist;
CREATE TRIGGER trust_watchlist_updated_at BEFORE UPDATE ON trust_watchlist FOR EACH ROW EXECUTE FUNCTION set_updated_at();
