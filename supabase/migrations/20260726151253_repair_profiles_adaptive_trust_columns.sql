-- Repair: 20250717100000 was recorded as applied but profiles columns were missing.
-- Root cause of seller verification "Could not start seller account." —
-- ensureSellerRole updates listing_rules_accepted_at which did not exist.
-- Project: hlpojfurfldvcxfxhveg

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS adaptive_trust_level SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS adaptive_trust_override SMALLINT,
  ADD COLUMN IF NOT EXISTS verification_escalation_reason TEXT,
  ADD COLUMN IF NOT EXISTS verification_escalated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_escalated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS listing_rules_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_resolved_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS bank_verified_at TIMESTAMPTZ;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_adaptive_trust_level_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_adaptive_trust_level_check
  CHECK (adaptive_trust_level BETWEEN 0 AND 5);

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_adaptive_trust_override_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_adaptive_trust_override_check
  CHECK (adaptive_trust_override IS NULL OR adaptive_trust_override BETWEEN 0 AND 5);

CREATE INDEX IF NOT EXISTS profiles_adaptive_trust_level_idx
  ON public.profiles (adaptive_trust_level)
  WHERE adaptive_trust_level >= 4 OR verification_required = TRUE;

COMMENT ON COLUMN public.profiles.listing_rules_accepted_at IS
  'When the seller accepted listing rules during seller onboarding.';

NOTIFY pgrst, 'reload schema';
