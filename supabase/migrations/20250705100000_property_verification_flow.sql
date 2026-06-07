-- Property verification request flow — buyer intake, admin ops, verifier hardening

ALTER TABLE site_banners ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE site_banners ADD COLUMN IF NOT EXISTS cta_text TEXT DEFAULT 'Request Verification';

-- Extend property verification requests for full buyer workflow
ALTER TABLE property_verification_requests
  ALTER COLUMN property_id DROP NOT NULL;

ALTER TABLE property_verification_requests ADD COLUMN IF NOT EXISTS request_reference TEXT UNIQUE;
ALTER TABLE property_verification_requests ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'listing';
ALTER TABLE property_verification_requests ADD COLUMN IF NOT EXISTS buyer_full_name TEXT;
ALTER TABLE property_verification_requests ADD COLUMN IF NOT EXISTS buyer_email TEXT;
ALTER TABLE property_verification_requests ADD COLUMN IF NOT EXISTS buyer_whatsapp TEXT;
ALTER TABLE property_verification_requests ADD COLUMN IF NOT EXISTS buyer_city TEXT;
ALTER TABLE property_verification_requests ADD COLUMN IF NOT EXISTS buyer_country TEXT DEFAULT 'Nigeria';
ALTER TABLE property_verification_requests ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT DEFAULT 'whatsapp';
ALTER TABLE property_verification_requests ADD COLUMN IF NOT EXISTS property_link TEXT;
ALTER TABLE property_verification_requests ADD COLUMN IF NOT EXISTS property_title TEXT;
ALTER TABLE property_verification_requests ADD COLUMN IF NOT EXISTS property_type TEXT;
ALTER TABLE property_verification_requests ADD COLUMN IF NOT EXISTS property_purpose TEXT;
ALTER TABLE property_verification_requests ADD COLUMN IF NOT EXISTS property_location_text TEXT;
ALTER TABLE property_verification_requests ADD COLUMN IF NOT EXISTS agent_company_name TEXT;
ALTER TABLE property_verification_requests ADD COLUMN IF NOT EXISTS asking_price TEXT;
ALTER TABLE property_verification_requests ADD COLUMN IF NOT EXISTS verification_needs JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE property_verification_requests ADD COLUMN IF NOT EXISTS buyer_context JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE property_verification_requests ADD COLUMN IF NOT EXISTS concern_flags JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE property_verification_requests ADD COLUMN IF NOT EXISTS is_diaspora_request BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE property_verification_requests ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal';
ALTER TABLE property_verification_requests ADD COLUMN IF NOT EXISTS admin_internal_notes TEXT;
ALTER TABLE property_verification_requests ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ;
ALTER TABLE property_verification_requests ADD COLUMN IF NOT EXISTS contacted_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE property_verification_requests ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'not_requested';
ALTER TABLE property_verification_requests ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE property_verification_requests ADD COLUMN IF NOT EXISTS admin_fee NUMERIC(14, 2) NOT NULL DEFAULT 0;
ALTER TABLE property_verification_requests ADD COLUMN IF NOT EXISTS payout_status TEXT;
ALTER TABLE property_verification_requests ADD COLUMN IF NOT EXISTS legal_review_requested BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE property_verification_requests ADD COLUMN IF NOT EXISTS legal_partner_assigned UUID;
ALTER TABLE property_verification_requests ADD COLUMN IF NOT EXISTS legal_review_status TEXT;
ALTER TABLE property_verification_requests ADD COLUMN IF NOT EXISTS assignment_expires_at TIMESTAMPTZ;
ALTER TABLE property_verification_requests ADD COLUMN IF NOT EXISTS buyer_summary TEXT;
ALTER TABLE property_verification_requests ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE property_verification_requests ADD COLUMN IF NOT EXISTS buyer_feedback JSONB;
ALTER TABLE property_verification_requests ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE property_verification_requests ADD COLUMN IF NOT EXISTS preferred_timeline TEXT;

CREATE INDEX IF NOT EXISTS property_verification_requests_reference_idx
  ON property_verification_requests (request_reference);
CREATE INDEX IF NOT EXISTS property_verification_requests_priority_idx
  ON property_verification_requests (priority, requested_at DESC);

ALTER TABLE property_verification_requests DROP CONSTRAINT IF EXISTS property_verification_requests_status_check;
ALTER TABLE property_verification_requests
  ADD CONSTRAINT property_verification_requests_status_check
  CHECK (status IN (
    'submitted', 'contacted', 'under_review', 'awaiting_assignment',
    'assigned', 'accepted', 'in_progress', 'completed', 'reviewed',
    'delivered', 'closed', 'fraud_review', 'rejected', 'cancelled',
    'pending'
  ));

ALTER TABLE property_verification_requests DROP CONSTRAINT IF EXISTS property_verification_requests_priority_check;
ALTER TABLE property_verification_requests
  ADD CONSTRAINT property_verification_requests_priority_check
  CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

ALTER TABLE property_verification_requests DROP CONSTRAINT IF EXISTS property_verification_requests_payment_status_check;
ALTER TABLE property_verification_requests
  ADD CONSTRAINT property_verification_requests_payment_status_check
  CHECK (payment_status IN ('not_requested', 'quoted', 'pending', 'paid', 'waived', 'refunded'));

-- Verifier performance tracking
ALTER TABLE field_verifiers ADD COLUMN IF NOT EXISTS response_score NUMERIC(5, 2) NOT NULL DEFAULT 100;
ALTER TABLE field_verifiers ADD COLUMN IF NOT EXISTS performance_score NUMERIC(5, 2) NOT NULL DEFAULT 100;
ALTER TABLE field_verifiers ADD COLUMN IF NOT EXISTS assignments_expired INTEGER NOT NULL DEFAULT 0;
ALTER TABLE field_verifiers ADD COLUMN IF NOT EXISTS assignments_declined INTEGER NOT NULL DEFAULT 0;
ALTER TABLE field_verifiers ADD COLUMN IF NOT EXISTS avg_acceptance_minutes NUMERIC(10, 2);

-- Report hardening
ALTER TABLE property_verification_reports ADD COLUMN IF NOT EXISTS neighborhood_quality TEXT;
ALTER TABLE property_verification_reports ADD COLUMN IF NOT EXISTS local_feedback TEXT;
ALTER TABLE property_verification_reports ADD COLUMN IF NOT EXISTS suspicious_signs TEXT;
ALTER TABLE property_verification_reports ADD COLUMN IF NOT EXISTS overall_observation TEXT;
ALTER TABLE property_verification_reports ADD COLUMN IF NOT EXISTS report_valid_until TIMESTAMPTZ;
ALTER TABLE property_verification_reports ADD COLUMN IF NOT EXISTS photo_checklist JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Program config extensions
ALTER TABLE field_verifier_program_config ADD COLUMN IF NOT EXISTS assignment_expire_hours INTEGER NOT NULL DEFAULT 2;
ALTER TABLE field_verifier_program_config ADD COLUMN IF NOT EXISTS report_valid_days INTEGER NOT NULL DEFAULT 14;
ALTER TABLE field_verifier_program_config ADD COLUMN IF NOT EXISTS min_report_images INTEGER NOT NULL DEFAULT 3;
ALTER TABLE field_verifier_program_config ADD COLUMN IF NOT EXISTS min_report_chars INTEGER NOT NULL DEFAULT 80;

-- Admin ops alerts (in-app queue)
CREATE TABLE IF NOT EXISTS staff_ops_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  priority TEXT NOT NULL DEFAULT 'normal',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS staff_ops_alerts_unread_idx
  ON staff_ops_alerts (read_at, created_at DESC);

ALTER TABLE staff_ops_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS staff_ops_alerts_staff ON staff_ops_alerts;
CREATE POLICY staff_ops_alerts_staff ON staff_ops_alerts FOR ALL USING (is_staff_admin());

-- RLS: buyers see own requests by user id
DROP POLICY IF EXISTS property_verification_requests_requester ON property_verification_requests;
CREATE POLICY property_verification_requests_requester ON property_verification_requests FOR SELECT USING (
  requester_user_id = auth.uid()
);
