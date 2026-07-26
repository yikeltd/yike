-- Repair: privileged-columns trigger references operational_suspicion_score
-- but the column was missing on production (20250718100000 recorded/skipped).
-- Any non-bypass profiles UPDATE crashed: record "new" has no field ...
-- Project: hlpojfurfldvcxfxhveg

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS operational_suspicion_score INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verification_state TEXT NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS required_verification_tasks JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_verification_state_check;
ALTER TABLE public.profiles
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

COMMENT ON COLUMN public.profiles.operational_suspicion_score IS
  'Abuse / verification control suspicion score (staff/system writable).';

NOTIFY pgrst, 'reload schema';
