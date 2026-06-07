-- Yike City Ambassador program — commission-based growth network

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_account_type_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_account_type_check
  CHECK (account_type IN ('individual', 'agency', 'developer', 'landlord', 'city_ambassador'));

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referred_by_ambassador_id UUID,
  ADD COLUMN IF NOT EXISTS referral_code_used TEXT,
  ADD COLUMN IF NOT EXISTS attributed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attribution_locked BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS profiles_ambassador_referral_idx
  ON profiles (referred_by_ambassador_id)
  WHERE referred_by_ambassador_id IS NOT NULL;

-- City ambassador slots (admin-controlled capacity per city)
CREATE TABLE IF NOT EXISTS city_ambassador_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  max_slots INTEGER NOT NULL DEFAULT 2,
  active_slots INTEGER NOT NULL DEFAULT 0,
  recruitment_paused BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS city_ambassador_slots_city_state_uq
  ON city_ambassador_slots (LOWER(city), LOWER(state));

-- Applications (public intake)
CREATE TABLE IF NOT EXISTS ambassador_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  occupation TEXT,
  years_experience INTEGER NOT NULL DEFAULT 0,
  why_apply TEXT NOT NULL,
  market_knowledge TEXT,
  social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
  referral_source TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  waitlisted BOOLEAN NOT NULL DEFAULT FALSE,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE ambassador_applications DROP CONSTRAINT IF EXISTS ambassador_applications_status_check;
ALTER TABLE ambassador_applications
  ADD CONSTRAINT ambassador_applications_status_check
  CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'waitlisted'));

CREATE INDEX IF NOT EXISTS ambassador_applications_status_idx
  ON ambassador_applications (status, created_at DESC);
CREATE INDEX IF NOT EXISTS ambassador_applications_email_idx
  ON ambassador_applications (LOWER(email));

-- Approved ambassadors (forward ref — create table before profiles FK)
CREATE TABLE IF NOT EXISTS city_ambassadors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  application_id UUID REFERENCES ambassador_applications(id) ON DELETE SET NULL,
  ambassador_code TEXT NOT NULL UNIQUE,
  ambassador_slug TEXT UNIQUE,
  assigned_city TEXT NOT NULL,
  assigned_state TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  commission_percentage NUMERIC(5, 4) NOT NULL DEFAULT 0.1000,
  onboarding_count INTEGER NOT NULL DEFAULT 0,
  active_revenue_accounts INTEGER NOT NULL DEFAULT 0,
  total_visible_earnings NUMERIC(14, 2) NOT NULL DEFAULT 0,
  current_month_earnings NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_paid NUMERIC(14, 2) NOT NULL DEFAULT 0,
  lifetime_generated_revenue NUMERIC(14, 2) NOT NULL DEFAULT 0,
  fraud_flags_count INTEGER NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_referred_by_ambassador_id_fkey;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_referred_by_ambassador_id_fkey
  FOREIGN KEY (referred_by_ambassador_id) REFERENCES city_ambassadors(id) ON DELETE SET NULL;

ALTER TABLE city_ambassadors DROP CONSTRAINT IF EXISTS city_ambassadors_status_check;
ALTER TABLE city_ambassadors
  ADD CONSTRAINT city_ambassadors_status_check
  CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'paused', 'disabled', 'inactive'));

CREATE INDEX IF NOT EXISTS city_ambassadors_profile_idx ON city_ambassadors (profile_id);
CREATE INDEX IF NOT EXISTS city_ambassadors_code_idx ON city_ambassadors (ambassador_code);
CREATE INDEX IF NOT EXISTS city_ambassadors_city_idx ON city_ambassadors (assigned_city, assigned_state, status);

CREATE TABLE IF NOT EXISTS ambassador_bank_details (
  ambassador_id UUID PRIMARY KEY REFERENCES city_ambassadors(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ambassador_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID NOT NULL REFERENCES city_ambassadors(id) ON DELETE CASCADE,
  source_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  source_company_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  payment_reference TEXT NOT NULL,
  revenue_source_type TEXT NOT NULL,
  gross_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  commission_percentage NUMERIC(5, 4) NOT NULL,
  commission_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  hidden_from_ambassador BOOLEAN NOT NULL DEFAULT FALSE,
  hidden_reason TEXT,
  fraud_review BOOLEAN NOT NULL DEFAULT FALSE,
  payable_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  reversed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (payment_reference)
);

ALTER TABLE ambassador_commissions DROP CONSTRAINT IF EXISTS ambassador_commissions_status_check;
ALTER TABLE ambassador_commissions
  ADD CONSTRAINT ambassador_commissions_status_check
  CHECK (status IN ('pending', 'approved', 'payable', 'paid', 'reversed', 'fraud_review', 'held'));

ALTER TABLE ambassador_commissions DROP CONSTRAINT IF EXISTS ambassador_commissions_revenue_type_check;
ALTER TABLE ambassador_commissions
  ADD CONSTRAINT ambassador_commissions_revenue_type_check
  CHECK (revenue_source_type IN (
    'featured_listing', 'premium_plan', 'listing_boost', 'company_verification',
    'inspection_fee', 'direct_lead_package', 'future_premium_service'
  ));

CREATE INDEX IF NOT EXISTS ambassador_commissions_ambassador_idx
  ON ambassador_commissions (ambassador_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS ambassador_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID NOT NULL REFERENCES city_ambassadors(id) ON DELETE CASCADE,
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

ALTER TABLE ambassador_payouts DROP CONSTRAINT IF EXISTS ambassador_payouts_status_check;
ALTER TABLE ambassador_payouts
  ADD CONSTRAINT ambassador_payouts_status_check
  CHECK (status IN ('pending', 'approved', 'paid', 'rejected', 'held'));

CREATE TABLE IF NOT EXISTS ambassador_monthly_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID NOT NULL REFERENCES city_ambassadors(id) ON DELETE CASCADE,
  period_year_month TEXT NOT NULL,
  visible_earnings NUMERIC(14, 2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  onboarded_count INTEGER NOT NULL DEFAULT 0,
  paying_accounts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (ambassador_id, period_year_month)
);

CREATE TABLE IF NOT EXISTS ambassador_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  city TEXT,
  state TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  used_by_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Program config singleton
CREATE TABLE IF NOT EXISTS ambassador_program_config (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE,
  commission_hold_days INTEGER NOT NULL DEFAULT 10,
  default_commission_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.1000,
  inactivity_days INTEGER NOT NULL DEFAULT 90,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ambassador_program_config_singleton CHECK (id = TRUE)
);

INSERT INTO ambassador_program_config (id) VALUES (TRUE) ON CONFLICT (id) DO NOTHING;

-- Seed priority city slots
INSERT INTO city_ambassador_slots (city, state, max_slots, active_slots)
SELECT v.city, v.state, v.max_slots, 0
FROM (VALUES
  ('Lagos', 'Lagos', 5),
  ('Abuja', 'FCT', 4),
  ('Port Harcourt', 'Rivers', 3),
  ('Aba', 'Abia', 2),
  ('Enugu', 'Enugu', 2),
  ('Benin City', 'Edo', 2),
  ('Ibadan', 'Oyo', 3),
  ('Kano', 'Kano', 3)
) AS v(city, state, max_slots)
WHERE NOT EXISTS (
  SELECT 1 FROM city_ambassador_slots s
  WHERE LOWER(s.city) = LOWER(v.city) AND LOWER(s.state) = LOWER(v.state)
);

-- RLS
ALTER TABLE city_ambassador_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambassador_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_ambassadors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambassador_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambassador_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambassador_bank_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambassador_monthly_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambassador_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambassador_program_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY city_ambassador_slots_staff ON city_ambassador_slots
  FOR ALL USING (is_staff_admin());

CREATE POLICY ambassador_applications_staff ON ambassador_applications
  FOR ALL USING (is_staff_admin());

CREATE POLICY city_ambassadors_staff ON city_ambassadors
  FOR ALL USING (is_staff_admin());

CREATE POLICY city_ambassadors_self_select ON city_ambassadors
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY ambassador_commissions_staff ON ambassador_commissions
  FOR ALL USING (is_staff_admin());

CREATE POLICY ambassador_commissions_self ON ambassador_commissions
  FOR SELECT USING (
    ambassador_id IN (SELECT id FROM city_ambassadors WHERE profile_id = auth.uid())
    AND hidden_from_ambassador = FALSE
  );

CREATE POLICY ambassador_payouts_staff ON ambassador_payouts
  FOR ALL USING (is_staff_admin());

CREATE POLICY ambassador_payouts_self ON ambassador_payouts
  FOR SELECT USING (
    ambassador_id IN (SELECT id FROM city_ambassadors WHERE profile_id = auth.uid())
  );

CREATE POLICY ambassador_bank_self ON ambassador_bank_details
  FOR ALL USING (
    ambassador_id IN (SELECT id FROM city_ambassadors WHERE profile_id = auth.uid())
  );
CREATE POLICY ambassador_bank_staff ON ambassador_bank_details
  FOR ALL USING (is_staff_admin());

CREATE POLICY ambassador_snapshots_staff ON ambassador_monthly_snapshots
  FOR ALL USING (is_staff_admin());
CREATE POLICY ambassador_snapshots_self ON ambassador_monthly_snapshots
  FOR SELECT USING (
    ambassador_id IN (SELECT id FROM city_ambassadors WHERE profile_id = auth.uid())
  );

CREATE POLICY ambassador_invites_staff ON ambassador_invites
  FOR ALL USING (is_staff_admin());
CREATE POLICY ambassador_program_config_staff ON ambassador_program_config
  FOR ALL USING (is_staff_admin());

CREATE TRIGGER city_ambassador_slots_updated_at
  BEFORE UPDATE ON city_ambassador_slots
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER ambassador_applications_updated_at
  BEFORE UPDATE ON ambassador_applications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER city_ambassadors_updated_at
  BEFORE UPDATE ON city_ambassadors
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER ambassador_commissions_updated_at
  BEFORE UPDATE ON ambassador_commissions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER ambassador_payouts_updated_at
  BEFORE UPDATE ON ambassador_payouts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
