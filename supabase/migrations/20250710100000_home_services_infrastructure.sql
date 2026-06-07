-- Home & Relocation Services — future preparation layer (internal / feature-flagged)

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_account_type_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_account_type_check
  CHECK (account_type IN (
    'individual', 'agency', 'developer', 'landlord',
    'city_ambassador', 'field_verifier', 'legal_partner', 'service_provider'
  ));

CREATE TABLE IF NOT EXISTS service_provider_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  phone TEXT,
  provider_type TEXT NOT NULL,
  business_name TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  service_areas TEXT[] NOT NULL DEFAULT '{}',
  years_experience INTEGER,
  bio TEXT,
  why_apply TEXT,
  profile_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE service_provider_applications DROP CONSTRAINT IF EXISTS service_provider_applications_status_check;
ALTER TABLE service_provider_applications
  ADD CONSTRAINT service_provider_applications_status_check
  CHECK (status IN ('pending', 'under_review', 'approved', 'rejected'));

ALTER TABLE service_provider_applications DROP CONSTRAINT IF EXISTS service_provider_applications_type_check;
ALTER TABLE service_provider_applications
  ADD CONSTRAINT service_provider_applications_type_check
  CHECK (provider_type IN (
    'mover', 'painter', 'electrician', 'plumber', 'cleaner',
    'relocation_support', 'carpenter', 'ac_technician',
    'interior_designer', 'fumigation', 'generator_technician'
  ));

CREATE INDEX IF NOT EXISTS service_provider_applications_status_idx
  ON service_provider_applications (status, created_at DESC);

CREATE TABLE IF NOT EXISTS service_provider_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  application_id UUID REFERENCES service_provider_applications(id) ON DELETE SET NULL,
  provider_reference TEXT NOT NULL UNIQUE,
  provider_type TEXT NOT NULL,
  business_name TEXT,
  full_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  bio TEXT,
  profile_image TEXT,
  banner_image TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  service_areas TEXT[] NOT NULL DEFAULT '{}',
  whatsapp TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  years_experience INTEGER,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  trust_status TEXT NOT NULL DEFAULT 'neutral',
  availability_status TEXT NOT NULL DEFAULT 'unavailable',
  average_rating NUMERIC(4, 2),
  total_jobs INTEGER NOT NULL DEFAULT 0,
  complaint_count INTEGER NOT NULL DEFAULT 0,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  payout_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  admin_notes TEXT,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE service_provider_profiles DROP CONSTRAINT IF EXISTS service_provider_profiles_type_check;
ALTER TABLE service_provider_profiles
  ADD CONSTRAINT service_provider_profiles_type_check
  CHECK (provider_type IN (
    'mover', 'painter', 'electrician', 'plumber', 'cleaner',
    'relocation_support', 'carpenter', 'ac_technician',
    'interior_designer', 'fumigation', 'generator_technician'
  ));

ALTER TABLE service_provider_profiles DROP CONSTRAINT IF EXISTS service_provider_profiles_verification_check;
ALTER TABLE service_provider_profiles
  ADD CONSTRAINT service_provider_profiles_verification_check
  CHECK (verification_status IN (
    'pending', 'under_review', 'approved', 'paused', 'suspended', 'fraud_review'
  ));

ALTER TABLE service_provider_profiles DROP CONSTRAINT IF EXISTS service_provider_profiles_trust_check;
ALTER TABLE service_provider_profiles
  ADD CONSTRAINT service_provider_profiles_trust_check
  CHECK (trust_status IN (
    'neutral', 'trusted', 'elevated_risk', 'high_risk', 'fraud_review'
  ));

ALTER TABLE service_provider_profiles DROP CONSTRAINT IF EXISTS service_provider_profiles_availability_check;
ALTER TABLE service_provider_profiles
  ADD CONSTRAINT service_provider_profiles_availability_check
  CHECK (availability_status IN ('available', 'limited', 'unavailable', 'paused'));

CREATE INDEX IF NOT EXISTS service_provider_profiles_city_idx
  ON service_provider_profiles (state, city, provider_type);
CREATE INDEX IF NOT EXISTS service_provider_profiles_status_idx
  ON service_provider_profiles (verification_status, availability_status);

CREATE TABLE IF NOT EXISTS service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_reference TEXT NOT NULL UNIQUE,
  requester_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  provider_id UUID REFERENCES service_provider_profiles(id) ON DELETE SET NULL,
  service_type TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  area TEXT,
  area_id TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  requester_name TEXT,
  requester_whatsapp TEXT,
  notes TEXT,
  admin_notes TEXT,
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE service_requests DROP CONSTRAINT IF EXISTS service_requests_status_check;
ALTER TABLE service_requests
  ADD CONSTRAINT service_requests_status_check
  CHECK (status IN (
    'submitted', 'reviewing', 'assigned', 'in_progress',
    'completed', 'disputed', 'cancelled'
  ));

ALTER TABLE service_requests DROP CONSTRAINT IF EXISTS service_requests_type_check;
ALTER TABLE service_requests
  ADD CONSTRAINT service_requests_type_check
  CHECK (service_type IN (
    'mover', 'painter', 'electrician', 'plumber', 'cleaner',
    'relocation_support', 'carpenter', 'ac_technician',
    'interior_designer', 'fumigation', 'generator_technician'
  ));

CREATE INDEX IF NOT EXISTS service_requests_status_idx
  ON service_requests (status, created_at DESC);

CREATE TABLE IF NOT EXISTS service_provider_complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES service_provider_profiles(id) ON DELETE CASCADE,
  service_request_id UUID REFERENCES service_requests(id) ON DELETE SET NULL,
  reporter_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  complaint_type TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  admin_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE service_provider_complaints DROP CONSTRAINT IF EXISTS service_provider_complaints_type_check;
ALTER TABLE service_provider_complaints
  ADD CONSTRAINT service_provider_complaints_type_check
  CHECK (complaint_type IN (
    'bad_service', 'incomplete_job', 'fraud_concern', 'no_show', 'pricing_dispute', 'other'
  ));

ALTER TABLE service_provider_complaints DROP CONSTRAINT IF EXISTS service_provider_complaints_status_check;
ALTER TABLE service_provider_complaints
  ADD CONSTRAINT service_provider_complaints_status_check
  CHECK (status IN ('submitted', 'under_review', 'resolved', 'dismissed', 'escalated'));

-- Future monetization / program config (internal)
CREATE TABLE IF NOT EXISTS home_services_program_config (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE,
  public_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  lead_fees_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  featured_providers_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  relocation_bundles_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  premium_services JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT home_services_program_config_singleton CHECK (id = TRUE)
);

INSERT INTO home_services_program_config (id, public_enabled) VALUES (TRUE, FALSE)
ON CONFLICT (id) DO NOTHING;

-- Extend trust score engine for service providers
ALTER TABLE trust_scores DROP CONSTRAINT IF EXISTS trust_scores_entity_type_check;
ALTER TABLE trust_scores
  ADD CONSTRAINT trust_scores_entity_type_check
  CHECK (entity_type IN (
    'agent', 'company', 'listing', 'field_verifier', 'legal_partner', 'service_provider'
  ));

ALTER TABLE trust_score_events DROP CONSTRAINT IF EXISTS trust_score_events_entity_type_check;
ALTER TABLE trust_score_events
  ADD CONSTRAINT trust_score_events_entity_type_check
  CHECK (entity_type IN (
    'agent', 'company', 'listing', 'field_verifier', 'legal_partner', 'service_provider'
  ));

ALTER TABLE trust_blacklist DROP CONSTRAINT IF EXISTS trust_blacklist_entity_check;
ALTER TABLE trust_blacklist
  ADD CONSTRAINT trust_blacklist_entity_check
  CHECK (entity_type IN (
    'verifier', 'legal_partner', 'agent', 'company', 'buyer', 'service_provider'
  ));

ALTER TABLE trust_watchlist DROP CONSTRAINT IF EXISTS trust_watchlist_entity_check;
ALTER TABLE trust_watchlist
  ADD CONSTRAINT trust_watchlist_entity_check
  CHECK (entity_type IN (
    'agent', 'company', 'buyer', 'verifier', 'legal_partner', 'service_provider'
  ));

-- RLS — staff only
ALTER TABLE service_provider_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_provider_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_services_program_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_provider_applications_staff ON service_provider_applications;
CREATE POLICY service_provider_applications_staff ON service_provider_applications
  FOR ALL USING (is_staff_admin());

DROP POLICY IF EXISTS service_provider_profiles_staff ON service_provider_profiles;
CREATE POLICY service_provider_profiles_staff ON service_provider_profiles
  FOR ALL USING (is_staff_admin());

DROP POLICY IF EXISTS service_requests_staff ON service_requests;
CREATE POLICY service_requests_staff ON service_requests
  FOR ALL USING (is_staff_admin());

DROP POLICY IF EXISTS service_provider_complaints_staff ON service_provider_complaints;
CREATE POLICY service_provider_complaints_staff ON service_provider_complaints
  FOR ALL USING (is_staff_admin());

DROP POLICY IF EXISTS home_services_program_config_staff ON home_services_program_config;
CREATE POLICY home_services_program_config_staff ON home_services_program_config
  FOR ALL USING (is_staff_admin());

DROP TRIGGER IF EXISTS service_provider_applications_updated_at ON service_provider_applications;
CREATE TRIGGER service_provider_applications_updated_at
  BEFORE UPDATE ON service_provider_applications FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS service_provider_profiles_updated_at ON service_provider_profiles;
CREATE TRIGGER service_provider_profiles_updated_at
  BEFORE UPDATE ON service_provider_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS service_requests_updated_at ON service_requests;
CREATE TRIGGER service_requests_updated_at
  BEFORE UPDATE ON service_requests FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS service_provider_complaints_updated_at ON service_provider_complaints;
CREATE TRIGGER service_provider_complaints_updated_at
  BEFORE UPDATE ON service_provider_complaints FOR EACH ROW EXECUTE FUNCTION set_updated_at();
