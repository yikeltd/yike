-- Lead tracking + monetization foundation

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_id TEXT,
  user_ip_hash TEXT,
  listing_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lead_type TEXT NOT NULL CHECK (lead_type IN ('whatsapp', 'call')),
  source_page TEXT,
  message TEXT,
  yike_reference TEXT NOT NULL UNIQUE,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'clicked' CHECK (status IN ('clicked', 'connected', 'converted')),
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS leads_agent_clicked_idx ON leads (agent_id, clicked_at DESC);
CREATE INDEX IF NOT EXISTS leads_listing_clicked_idx ON leads (listing_id, clicked_at DESC);
CREATE INDEX IF NOT EXISTS leads_type_clicked_idx ON leads (lead_type, clicked_at DESC);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'pro', 'agency'));

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS is_boosted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS boosted_until TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION yike_log_lead(
  p_token text,
  p_user_id uuid,
  p_guest_id text,
  p_user_ip_hash text,
  p_listing_id uuid,
  p_agent_id uuid,
  p_lead_type text,
  p_source_page text,
  p_message text,
  p_yike_reference text,
  p_user_agent text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  PERFORM yike_assert_otp_token(p_token);
  INSERT INTO leads (
    user_id, guest_id, user_ip_hash, listing_id, agent_id,
    lead_type, source_page, message, yike_reference, user_agent, status
  ) VALUES (
    p_user_id, p_guest_id, p_user_ip_hash, p_listing_id, p_agent_id,
    p_lead_type, p_source_page, p_message, p_yike_reference, p_user_agent, 'clicked'
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION yike_log_lead(
  text, uuid, text, text, uuid, uuid, text, text, text, text, text
) TO anon, authenticated, service_role;
