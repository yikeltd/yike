-- Seller Verification & Onboarding v1 — timestamps on profiles.
-- Extends existing contact + verification_status; does not invent a parallel enum.
-- Founder must apply on production (do not auto-push).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS seller_profile_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verification_notes TEXT;

COMMENT ON COLUMN profiles.phone_verified_at IS 'When SMS/WhatsApp phone OTP succeeded';
COMMENT ON COLUMN profiles.seller_profile_completed_at IS 'When required seller profile fields (state, address, DOB) were saved';
COMMENT ON COLUMN profiles.verification_submitted_at IS 'When seller submitted for manual review';
COMMENT ON COLUMN profiles.verified_at IS 'When admin approved Verified Seller';
COMMENT ON COLUMN profiles.verified_by IS 'Admin who approved Verified Seller';
COMMENT ON COLUMN profiles.verification_notes IS 'Latest admin verification notes / request-info text';

-- Backfill phone_verified_at from WhatsApp timestamp when already phone-verified.
-- profiles has created_at (no updated_at).
UPDATE profiles
SET phone_verified_at = COALESCE(whatsapp_verified_at, created_at)
WHERE phone_verified = true
  AND phone_verified_at IS NULL;

-- Backfill seller_profile_completed_at when core fields already present.
UPDATE profiles
SET seller_profile_completed_at = created_at
WHERE seller_profile_completed_at IS NULL
  AND date_of_birth IS NOT NULL
  AND NULLIF(TRIM(COALESCE(residential_state, '')), '') IS NOT NULL
  AND (
    NULLIF(TRIM(COALESCE(residential_address, '')), '') IS NOT NULL
    OR NULLIF(TRIM(COALESCE(office_address, '')), '') IS NOT NULL
  );

-- Backfill verification_submitted_at from pending/approved status.
UPDATE profiles
SET verification_submitted_at = created_at
WHERE verification_submitted_at IS NULL
  AND verification_status IN ('pending', 'approved', 'verified');
