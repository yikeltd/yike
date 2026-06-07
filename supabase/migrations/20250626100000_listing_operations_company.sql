-- Listing lifecycle plans, company verification, branding

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS listing_plan TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS listing_duration_days INTEGER NOT NULL DEFAULT 14,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reactivated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_reactivated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS unavailable_at TIMESTAMPTZ;

ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_listing_plan_check;
ALTER TABLE properties
  ADD CONSTRAINT properties_listing_plan_check
  CHECK (listing_plan IN ('free', 'premium_30', 'premium_60', 'admin_extended'));

UPDATE properties
SET
  published_at = COALESCE(published_at, created_at),
  listing_duration_days = 14,
  listing_plan = 'free'
WHERE published_at IS NULL;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS company_logo_url TEXT,
  ADD COLUMN IF NOT EXISTS company_cover_url TEXT,
  ADD COLUMN IF NOT EXISTS company_bio TEXT,
  ADD COLUMN IF NOT EXISTS company_slug TEXT,
  ADD COLUMN IF NOT EXISTS office_address TEXT,
  ADD COLUMN IF NOT EXISTS cac_number TEXT,
  ADD COLUMN IF NOT EXISTS company_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS company_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS company_verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_company_slug_idx
  ON profiles (LOWER(company_slug))
  WHERE company_slug IS NOT NULL AND company_slug <> '';

CREATE TABLE IF NOT EXISTS company_verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cac_number TEXT,
  cac_document_url TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_account_name TEXT,
  applicant_name TEXT,
  applicant_role TEXT,
  applicant_phone TEXT,
  applicant_email TEXT,
  applicant_id_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'needs_more_info')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS company_verification_requests_status_idx
  ON company_verification_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS company_verification_requests_company_idx
  ON company_verification_requests (company_id, created_at DESC);

ALTER TABLE company_verification_requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS properties_expires_at_idx ON properties (expires_at);
CREATE INDEX IF NOT EXISTS properties_agent_status_idx ON properties (agent_id, status);

-- Mark expired listings (run via cron or manual)
CREATE OR REPLACE FUNCTION yike_mark_expired_listings()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE properties
  SET
    expired_at = COALESCE(expired_at, NOW()),
    availability_status = CASE
      WHEN availability_status = 'available' THEN 'unavailable'
      ELSE availability_status
    END,
    unavailable_at = COALESCE(unavailable_at, NOW())
  WHERE status = 'approved'
    AND expires_at <= NOW()
    AND expired_at IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
