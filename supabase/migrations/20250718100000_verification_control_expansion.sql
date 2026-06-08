-- Verification control expansion: toggles, permissions, status states

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
