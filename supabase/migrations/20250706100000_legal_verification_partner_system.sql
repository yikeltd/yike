-- Legal Verification Partner system — isolated from Field Verifiers

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_account_type_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_account_type_check
  CHECK (account_type IN (
    'individual', 'agency', 'developer', 'landlord',
    'city_ambassador', 'field_verifier', 'legal_partner'
  ));

CREATE TABLE IF NOT EXISTS legal_partner_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  phone_number TEXT,
  profile_photo_url TEXT,
  firm_name TEXT NOT NULL,
  years_of_practice INTEGER,
  specializations TEXT,
  operating_cities TEXT,
  property_law_experience TEXT,
  cac_number TEXT,
  enrollment_number TEXT,
  office_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  nearest_landmark TEXT,
  why_apply TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE legal_partner_applications DROP CONSTRAINT IF EXISTS legal_partner_applications_status_check;
ALTER TABLE legal_partner_applications
  ADD CONSTRAINT legal_partner_applications_status_check
  CHECK (status IN ('pending', 'under_review', 'approved', 'rejected'));

CREATE TABLE IF NOT EXISTS legal_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  application_id UUID REFERENCES legal_partner_applications(id) ON DELETE SET NULL,
  partner_code TEXT NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  whatsapp_number TEXT,
  phone_number TEXT,
  firm_name TEXT NOT NULL,
  assigned_city TEXT NOT NULL,
  assigned_state TEXT NOT NULL,
  operating_cities TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  trust_level TEXT NOT NULL DEFAULT 'basic',
  completed_reviews INTEGER NOT NULL DEFAULT 0,
  total_earnings NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_paid NUMERIC(14, 2) NOT NULL DEFAULT 0,
  fraud_flags_count INTEGER NOT NULL DEFAULT 0,
  performance_score NUMERIC(5, 2) NOT NULL DEFAULT 100,
  payout_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  payout_hold_reason TEXT,
  bank_change_pending_review BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE legal_partners DROP CONSTRAINT IF EXISTS legal_partners_status_check;
ALTER TABLE legal_partners
  ADD CONSTRAINT legal_partners_status_check
  CHECK (status IN ('pending', 'under_review', 'approved', 'paused', 'suspended', 'inactive', 'fraud_review'));

ALTER TABLE legal_partners DROP CONSTRAINT IF EXISTS legal_partners_trust_level_check;
ALTER TABLE legal_partners
  ADD CONSTRAINT legal_partners_trust_level_check
  CHECK (trust_level IN ('basic', 'verified', 'trusted', 'senior'));

CREATE INDEX IF NOT EXISTS legal_partners_profile_idx ON legal_partners (profile_id);
CREATE INDEX IF NOT EXISTS legal_partners_city_idx ON legal_partners (assigned_city, assigned_state, status);

CREATE TABLE IF NOT EXISTS legal_partner_bank_details (
  partner_id UUID PRIMARY KEY REFERENCES legal_partners(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS legal_partner_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES legal_partners(id) ON DELETE CASCADE,
  legal_request_id UUID NOT NULL,
  amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  fraud_review BOOLEAN NOT NULL DEFAULT FALSE,
  payable_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (legal_request_id)
);

ALTER TABLE legal_partner_earnings DROP CONSTRAINT IF EXISTS legal_partner_earnings_status_check;
ALTER TABLE legal_partner_earnings
  ADD CONSTRAINT legal_partner_earnings_status_check
  CHECK (status IN ('pending', 'payable', 'paid', 'held', 'reversed', 'fraud_review'));

CREATE TABLE IF NOT EXISTS legal_partner_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES legal_partners(id) ON DELETE CASCADE,
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

ALTER TABLE legal_partner_payouts DROP CONSTRAINT IF EXISTS legal_partner_payouts_status_check;
ALTER TABLE legal_partner_payouts
  ADD CONSTRAINT legal_partner_payouts_status_check
  CHECK (status IN ('pending', 'approved', 'paid', 'rejected', 'held'));

CREATE TABLE IF NOT EXISTS legal_verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_reference TEXT NOT NULL UNIQUE,
  requester_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  property_verification_request_id UUID REFERENCES property_verification_requests(id) ON DELETE SET NULL,
  assigned_legal_partner_id UUID REFERENCES legal_partners(id) ON DELETE SET NULL,
  listing_agent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  review_type TEXT NOT NULL DEFAULT 'level_1_basic',
  partner_fee NUMERIC(14, 2) NOT NULL DEFAULT 15000,
  buyer_full_name TEXT,
  buyer_email TEXT,
  buyer_whatsapp TEXT,
  property_title TEXT,
  property_location_text TEXT,
  buyer_notes TEXT,
  admin_notes TEXT,
  internal_risk_notes TEXT,
  uploaded_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_diaspora_request BOOLEAN NOT NULL DEFAULT FALSE,
  payment_status TEXT NOT NULL DEFAULT 'not_requested',
  terms_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  buyer_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE legal_verification_requests DROP CONSTRAINT IF EXISTS legal_verification_requests_status_check;
ALTER TABLE legal_verification_requests
  ADD CONSTRAINT legal_verification_requests_status_check
  CHECK (status IN (
    'submitted', 'contacted', 'awaiting_documents', 'under_review',
    'awaiting_assignment', 'assigned', 'in_progress', 'completed',
    'reviewed', 'delivered', 'fraud_review', 'closed', 'rejected', 'cancelled'
  ));

ALTER TABLE legal_verification_requests DROP CONSTRAINT IF EXISTS legal_verification_requests_review_type_check;
ALTER TABLE legal_verification_requests
  ADD CONSTRAINT legal_verification_requests_review_type_check
  CHECK (review_type IN (
    'level_1_basic', 'level_2_survey', 'level_3_registry',
    'level_4_opinion', 'level_5_advisory'
  ));

CREATE INDEX IF NOT EXISTS legal_verification_requests_status_idx
  ON legal_verification_requests (status, requested_at DESC);
CREATE INDEX IF NOT EXISTS legal_verification_requests_partner_idx
  ON legal_verification_requests (assigned_legal_partner_id, status);

CREATE TABLE IF NOT EXISTS legal_verification_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_request_id UUID NOT NULL UNIQUE REFERENCES legal_verification_requests(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES legal_partners(id) ON DELETE RESTRICT,
  documents_reviewed JSONB NOT NULL DEFAULT '[]'::jsonb,
  registry_search_conducted BOOLEAN NOT NULL DEFAULT FALSE,
  ownership_consistency_observed TEXT,
  litigation_concerns TEXT,
  survey_concerns TEXT,
  encumbrance_concerns TEXT,
  document_irregularities TEXT,
  risk_observations TEXT NOT NULL,
  recommendation_summary TEXT NOT NULL,
  overall_risk_level TEXT NOT NULL DEFAULT 'unclear',
  admin_review_status TEXT NOT NULL DEFAULT 'pending',
  admin_review_notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE legal_verification_reports DROP CONSTRAINT IF EXISTS legal_verification_reports_risk_check;
ALTER TABLE legal_verification_reports
  ADD CONSTRAINT legal_verification_reports_risk_check
  CHECK (overall_risk_level IN ('low', 'moderate', 'high', 'unclear'));

CREATE TABLE IF NOT EXISTS legal_partner_program_config (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE,
  default_partner_fee NUMERIC(14, 2) NOT NULL DEFAULT 15000,
  earnings_hold_days INTEGER NOT NULL DEFAULT 7,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT legal_partner_program_config_singleton CHECK (id = TRUE)
);

INSERT INTO legal_partner_program_config (id) VALUES (TRUE) ON CONFLICT (id) DO NOTHING;

-- Private document bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'legal-verification-docs',
  'legal-verification-docs',
  FALSE,
  15728640,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE legal_partner_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_partner_bank_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_partner_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_partner_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_verification_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_partner_program_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS legal_partner_applications_staff ON legal_partner_applications;
CREATE POLICY legal_partner_applications_staff ON legal_partner_applications FOR ALL USING (is_staff_admin());

DROP POLICY IF EXISTS legal_partners_staff ON legal_partners;
CREATE POLICY legal_partners_staff ON legal_partners FOR ALL USING (is_staff_admin());
DROP POLICY IF EXISTS legal_partners_self ON legal_partners;
CREATE POLICY legal_partners_self ON legal_partners FOR SELECT USING (profile_id = auth.uid());

DROP POLICY IF EXISTS legal_partner_bank_staff ON legal_partner_bank_details;
CREATE POLICY legal_partner_bank_staff ON legal_partner_bank_details FOR ALL USING (is_staff_admin());
DROP POLICY IF EXISTS legal_partner_bank_self ON legal_partner_bank_details;
CREATE POLICY legal_partner_bank_self ON legal_partner_bank_details FOR ALL USING (
  partner_id IN (SELECT id FROM legal_partners WHERE profile_id = auth.uid())
);

DROP POLICY IF EXISTS legal_partner_earnings_staff ON legal_partner_earnings;
CREATE POLICY legal_partner_earnings_staff ON legal_partner_earnings FOR ALL USING (is_staff_admin());
DROP POLICY IF EXISTS legal_partner_earnings_self ON legal_partner_earnings;
CREATE POLICY legal_partner_earnings_self ON legal_partner_earnings FOR SELECT USING (
  partner_id IN (SELECT id FROM legal_partners WHERE profile_id = auth.uid())
);

DROP POLICY IF EXISTS legal_partner_payouts_staff ON legal_partner_payouts;
CREATE POLICY legal_partner_payouts_staff ON legal_partner_payouts FOR ALL USING (is_staff_admin());
DROP POLICY IF EXISTS legal_partner_payouts_self ON legal_partner_payouts;
CREATE POLICY legal_partner_payouts_self ON legal_partner_payouts FOR SELECT USING (
  partner_id IN (SELECT id FROM legal_partners WHERE profile_id = auth.uid())
);

DROP POLICY IF EXISTS legal_verification_requests_staff ON legal_verification_requests;
CREATE POLICY legal_verification_requests_staff ON legal_verification_requests FOR ALL USING (is_staff_admin());
DROP POLICY IF EXISTS legal_verification_requests_requester ON legal_verification_requests;
CREATE POLICY legal_verification_requests_requester ON legal_verification_requests FOR SELECT USING (
  requester_user_id = auth.uid()
);
DROP POLICY IF EXISTS legal_verification_requests_partner ON legal_verification_requests;
CREATE POLICY legal_verification_requests_partner ON legal_verification_requests FOR SELECT USING (
  assigned_legal_partner_id IN (SELECT id FROM legal_partners WHERE profile_id = auth.uid())
);

DROP POLICY IF EXISTS legal_verification_reports_staff ON legal_verification_reports;
CREATE POLICY legal_verification_reports_staff ON legal_verification_reports FOR ALL USING (is_staff_admin());
DROP POLICY IF EXISTS legal_verification_reports_partner ON legal_verification_reports;
CREATE POLICY legal_verification_reports_partner ON legal_verification_reports FOR ALL USING (
  partner_id IN (SELECT id FROM legal_partners WHERE profile_id = auth.uid())
);

DROP POLICY IF EXISTS legal_partner_program_config_staff ON legal_partner_program_config;
CREATE POLICY legal_partner_program_config_staff ON legal_partner_program_config FOR ALL USING (is_staff_admin());

DROP POLICY IF EXISTS legal_verification_docs_staff ON storage.objects;
CREATE POLICY legal_verification_docs_staff ON storage.objects FOR ALL USING (
  bucket_id = 'legal-verification-docs' AND is_staff_admin()
);

CREATE TRIGGER legal_partner_applications_updated_at BEFORE UPDATE ON legal_partner_applications FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER legal_partners_updated_at BEFORE UPDATE ON legal_partners FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER legal_partner_earnings_updated_at BEFORE UPDATE ON legal_partner_earnings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER legal_partner_payouts_updated_at BEFORE UPDATE ON legal_partner_payouts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER legal_verification_requests_updated_at BEFORE UPDATE ON legal_verification_requests FOR EACH ROW EXECUTE FUNCTION set_updated_at();
