-- Production catch-up: allow account_type = 'agent' on profiles
-- Run in Supabase SQL Editor on hlpojfurfldvcxfxhveg if Agent signup fails.

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_account_type_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_account_type_check
  CHECK (account_type IN (
    'individual', 'agent', 'agency', 'developer', 'landlord',
    'city_ambassador', 'field_verifier', 'legal_partner', 'service_provider'
  ));

CREATE TABLE IF NOT EXISTS listing_submit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS listing_submit_log_user_created_idx
  ON listing_submit_log (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS listing_submit_log_ip_created_idx
  ON listing_submit_log (ip, created_at DESC)
  WHERE ip IS NOT NULL;

ALTER TABLE listing_submit_log ENABLE ROW LEVEL SECURITY;
