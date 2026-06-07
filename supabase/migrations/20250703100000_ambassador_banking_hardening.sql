-- Ambassador banking, address, and payout hardening

ALTER TABLE ambassador_applications
  ADD COLUMN IF NOT EXISTS residential_address TEXT,
  ADD COLUMN IF NOT EXISTS nearest_landmark TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'Nigeria';

ALTER TABLE city_ambassadors
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS residential_address TEXT,
  ADD COLUMN IF NOT EXISTS residential_city TEXT,
  ADD COLUMN IF NOT EXISTS residential_state TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'Nigeria',
  ADD COLUMN IF NOT EXISTS nearest_landmark TEXT,
  ADD COLUMN IF NOT EXISTS referral_link TEXT,
  ADD COLUMN IF NOT EXISTS identity_verification_level TEXT NOT NULL DEFAULT 'basic',
  ADD COLUMN IF NOT EXISTS nin_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending_basic',
  ADD COLUMN IF NOT EXISTS payout_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS payout_hold_reason TEXT,
  ADD COLUMN IF NOT EXISTS bank_change_pending_review BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE city_ambassadors DROP CONSTRAINT IF EXISTS city_ambassadors_verification_level_check;
ALTER TABLE city_ambassadors
  ADD CONSTRAINT city_ambassadors_verification_level_check
  CHECK (identity_verification_level IN ('basic', 'verified', 'trusted', 'field_verified'));

ALTER TABLE city_ambassadors DROP CONSTRAINT IF EXISTS city_ambassadors_verification_status_check;
ALTER TABLE city_ambassadors
  ADD CONSTRAINT city_ambassadors_verification_status_check
  CHECK (verification_status IN ('pending_basic', 'basic_complete', 'verified', 'trusted', 'suspended'));

ALTER TABLE ambassador_bank_details
  ADD COLUMN IF NOT EXISTS bank_code TEXT,
  ADD COLUMN IF NOT EXISTS bank_change_pending_review BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS previous_account_number TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS city_ambassadors_payout_review_idx
  ON city_ambassadors (bank_change_pending_review, payout_enabled)
  WHERE bank_change_pending_review = TRUE OR payout_enabled = FALSE;
