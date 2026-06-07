-- Independent Field Verifier system — isolated from City Ambassadors

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_account_type_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_account_type_check
  CHECK (account_type IN (
    'individual', 'agency', 'developer', 'landlord', 'city_ambassador', 'field_verifier'
  ));

CREATE TABLE IF NOT EXISTS field_verifier_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  phone_number TEXT,
  gender TEXT,
  date_of_birth DATE,
  residential_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Nigeria',
  nearest_landmark TEXT,
  occupation TEXT,
  real_estate_familiarity TEXT,
  inspection_experience TEXT,
  transportation_available BOOLEAN NOT NULL DEFAULT TRUE,
  coverage_areas TEXT,
  why_apply TEXT NOT NULL,
  profile_photo_url TEXT,
  id_type TEXT,
  social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE field_verifier_applications DROP CONSTRAINT IF EXISTS field_verifier_applications_status_check;
ALTER TABLE field_verifier_applications
  ADD CONSTRAINT field_verifier_applications_status_check
  CHECK (status IN ('pending', 'under_review', 'approved', 'rejected'));

CREATE INDEX IF NOT EXISTS field_verifier_applications_status_idx
  ON field_verifier_applications (status, created_at DESC);

CREATE TABLE IF NOT EXISTS field_verifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  application_id UUID REFERENCES field_verifier_applications(id) ON DELETE SET NULL,
  verifier_code TEXT NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  whatsapp_number TEXT,
  phone_number TEXT,
  assigned_city TEXT NOT NULL,
  assigned_state TEXT NOT NULL,
  coverage_areas TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  trust_level TEXT NOT NULL DEFAULT 'basic',
  identity_verification_level TEXT NOT NULL DEFAULT 'basic',
  nin_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_status TEXT NOT NULL DEFAULT 'pending_basic',
  completed_inspections INTEGER NOT NULL DEFAULT 0,
  total_earnings NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_paid NUMERIC(14, 2) NOT NULL DEFAULT 0,
  fraud_flags_count INTEGER NOT NULL DEFAULT 0,
  payout_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  payout_hold_reason TEXT,
  bank_change_pending_review BOOLEAN NOT NULL DEFAULT FALSE,
  last_activity_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE field_verifiers DROP CONSTRAINT IF EXISTS field_verifiers_status_check;
ALTER TABLE field_verifiers
  ADD CONSTRAINT field_verifiers_status_check
  CHECK (status IN ('pending', 'under_review', 'approved', 'paused', 'suspended', 'inactive', 'fraud_review'));

ALTER TABLE field_verifiers DROP CONSTRAINT IF EXISTS field_verifiers_trust_level_check;
ALTER TABLE field_verifiers
  ADD CONSTRAINT field_verifiers_trust_level_check
  CHECK (trust_level IN ('basic', 'verified', 'trusted', 'elite'));

CREATE INDEX IF NOT EXISTS field_verifiers_profile_idx ON field_verifiers (profile_id);
CREATE INDEX IF NOT EXISTS field_verifiers_city_idx ON field_verifiers (assigned_city, assigned_state, status);

CREATE TABLE IF NOT EXISTS field_verifier_bank_details (
  verifier_id UUID PRIMARY KEY REFERENCES field_verifiers(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  bank_code TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  bank_change_pending_review BOOLEAN NOT NULL DEFAULT FALSE,
  previous_account_number TEXT,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS field_verifier_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verifier_id UUID NOT NULL REFERENCES field_verifiers(id) ON DELETE CASCADE,
  verification_request_id UUID NOT NULL,
  amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  fraud_review BOOLEAN NOT NULL DEFAULT FALSE,
  payable_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  reversed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (verification_request_id)
);

ALTER TABLE field_verifier_earnings DROP CONSTRAINT IF EXISTS field_verifier_earnings_status_check;
ALTER TABLE field_verifier_earnings
  ADD CONSTRAINT field_verifier_earnings_status_check
  CHECK (status IN ('pending', 'payable', 'paid', 'held', 'reversed', 'fraud_review'));

CREATE TABLE IF NOT EXISTS field_verifier_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verifier_id UUID NOT NULL REFERENCES field_verifiers(id) ON DELETE CASCADE,
  period_year_month TEXT NOT NULL,
  payable_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE field_verifier_payouts DROP CONSTRAINT IF EXISTS field_verifier_payouts_status_check;
ALTER TABLE field_verifier_payouts
  ADD CONSTRAINT field_verifier_payouts_status_check
  CHECK (status IN ('pending', 'approved', 'paid', 'rejected', 'held'));

CREATE TABLE IF NOT EXISTS property_verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  requester_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  inspection_request_id UUID REFERENCES inspection_requests(id) ON DELETE SET NULL,
  assigned_verifier_id UUID REFERENCES field_verifiers(id) ON DELETE SET NULL,
  listing_agent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'awaiting_assignment',
  inspection_fee NUMERIC(14, 2) NOT NULL DEFAULT 0,
  verifier_fee NUMERIC(14, 2) NOT NULL DEFAULT 5000,
  assignment_notes TEXT,
  requester_notes TEXT,
  internal_notes TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE property_verification_requests DROP CONSTRAINT IF EXISTS property_verification_requests_status_check;
ALTER TABLE property_verification_requests
  ADD CONSTRAINT property_verification_requests_status_check
  CHECK (status IN (
    'pending', 'awaiting_assignment', 'assigned', 'accepted', 'in_progress',
    'completed', 'reviewed', 'rejected', 'cancelled', 'fraud_review'
  ));

CREATE INDEX IF NOT EXISTS property_verification_requests_status_idx
  ON property_verification_requests (status, requested_at DESC);
CREATE INDEX IF NOT EXISTS property_verification_requests_verifier_idx
  ON property_verification_requests (assigned_verifier_id, status);

CREATE TABLE IF NOT EXISTS property_verification_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_request_id UUID NOT NULL UNIQUE REFERENCES property_verification_requests(id) ON DELETE CASCADE,
  verifier_id UUID NOT NULL REFERENCES field_verifiers(id) ON DELETE RESTRICT,
  property_found BOOLEAN NOT NULL DEFAULT FALSE,
  property_accessible BOOLEAN NOT NULL DEFAULT FALSE,
  photos_match_listing BOOLEAN,
  occupancy_status TEXT,
  neighborhood_notes TEXT,
  road_access_notes TEXT,
  physical_condition_notes TEXT,
  met_agent_or_contact BOOLEAN,
  contact_person_name TEXT,
  inspection_summary TEXT NOT NULL,
  uploaded_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  uploaded_videos JSONB NOT NULL DEFAULT '[]'::jsonb,
  verifier_confidence_level TEXT NOT NULL DEFAULT 'medium',
  admin_review_status TEXT NOT NULL DEFAULT 'pending',
  admin_review_notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE property_verification_reports DROP CONSTRAINT IF EXISTS property_verification_reports_confidence_check;
ALTER TABLE property_verification_reports
  ADD CONSTRAINT property_verification_reports_confidence_check
  CHECK (verifier_confidence_level IN ('low', 'medium', 'high'));

CREATE TABLE IF NOT EXISTS field_verifier_program_config (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE,
  default_verifier_fee NUMERIC(14, 2) NOT NULL DEFAULT 5000,
  earnings_hold_days INTEGER NOT NULL DEFAULT 7,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT field_verifier_program_config_singleton CHECK (id = TRUE)
);

INSERT INTO field_verifier_program_config (id) VALUES (TRUE) ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE field_verifier_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_verifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_verifier_bank_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_verifier_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_verifier_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_verification_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_verifier_program_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY field_verifier_applications_staff ON field_verifier_applications FOR ALL USING (is_staff_admin());
CREATE POLICY field_verifiers_staff ON field_verifiers FOR ALL USING (is_staff_admin());
CREATE POLICY field_verifiers_self ON field_verifiers FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY field_verifier_bank_staff ON field_verifier_bank_details FOR ALL USING (is_staff_admin());
CREATE POLICY field_verifier_bank_self ON field_verifier_bank_details FOR ALL USING (
  verifier_id IN (SELECT id FROM field_verifiers WHERE profile_id = auth.uid())
);
CREATE POLICY field_verifier_earnings_staff ON field_verifier_earnings FOR ALL USING (is_staff_admin());
CREATE POLICY field_verifier_earnings_self ON field_verifier_earnings FOR SELECT USING (
  verifier_id IN (SELECT id FROM field_verifiers WHERE profile_id = auth.uid())
);
CREATE POLICY field_verifier_payouts_staff ON field_verifier_payouts FOR ALL USING (is_staff_admin());
CREATE POLICY field_verifier_payouts_self ON field_verifier_payouts FOR SELECT USING (
  verifier_id IN (SELECT id FROM field_verifiers WHERE profile_id = auth.uid())
);
CREATE POLICY property_verification_requests_staff ON property_verification_requests FOR ALL USING (is_staff_admin());
CREATE POLICY property_verification_requests_requester ON property_verification_requests FOR SELECT USING (
  requester_user_id = auth.uid()
);
CREATE POLICY property_verification_requests_verifier ON property_verification_requests FOR SELECT USING (
  assigned_verifier_id IN (SELECT id FROM field_verifiers WHERE profile_id = auth.uid())
);
CREATE POLICY property_verification_reports_staff ON property_verification_reports FOR ALL USING (is_staff_admin());
CREATE POLICY property_verification_reports_verifier ON property_verification_reports FOR ALL USING (
  verifier_id IN (SELECT id FROM field_verifiers WHERE profile_id = auth.uid())
);
CREATE POLICY field_verifier_program_config_staff ON field_verifier_program_config FOR ALL USING (is_staff_admin());

CREATE TRIGGER field_verifier_applications_updated_at BEFORE UPDATE ON field_verifier_applications FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER field_verifiers_updated_at BEFORE UPDATE ON field_verifiers FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER field_verifier_earnings_updated_at BEFORE UPDATE ON field_verifier_earnings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER field_verifier_payouts_updated_at BEFORE UPDATE ON field_verifier_payouts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER property_verification_requests_updated_at BEFORE UPDATE ON property_verification_requests FOR EACH ROW EXECUTE FUNCTION set_updated_at();
