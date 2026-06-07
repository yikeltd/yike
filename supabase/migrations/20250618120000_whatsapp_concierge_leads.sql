-- Human-assisted WhatsApp concierge leads + public listing/agent codes

-- ── Public listing code (yike + 6 digits) ────────────────────────────────────

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS public_listing_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS properties_public_listing_code_idx
  ON properties (public_listing_code)
  WHERE public_listing_code IS NOT NULL;

-- ── Public agent code (slug prefix + 6 digits) ─────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS public_agent_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_public_agent_code_idx
  ON profiles (public_agent_code)
  WHERE public_agent_code IS NOT NULL;

CREATE OR REPLACE FUNCTION yike_generate_public_listing_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_code text;
  v_try int := 0;
BEGIN
  LOOP
    v_code := 'yike' || lpad((floor(random() * 1000000)::int)::text, 6, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM properties WHERE public_listing_code = v_code);
    v_try := v_try + 1;
    EXIT WHEN v_try > 100;
  END LOOP;
  IF v_try > 100 THEN
    v_code := 'yike' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  END IF;
  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION yike_generate_public_agent_code(p_profile_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_prefix text;
  v_code text;
  v_try int := 0;
  v_slug text;
  v_name text;
BEGIN
  SELECT public_slug, full_name INTO v_slug, v_name
  FROM profiles WHERE id = p_profile_id;

  v_prefix := lower(regexp_replace(coalesce(v_slug, v_name, 'agent'), '[^a-z0-9]+', '', 'g'));
  v_prefix := left(v_prefix, 32);
  IF v_prefix = '' THEN v_prefix := 'agent'; END IF;

  LOOP
    v_code := v_prefix || lpad((floor(random() * 1000000)::int)::text, 6, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE public_agent_code = v_code);
    v_try := v_try + 1;
    EXIT WHEN v_try > 100;
  END LOOP;
  RETURN v_code;
END;
$$;

UPDATE properties
SET public_listing_code = yike_generate_public_listing_code()
WHERE public_listing_code IS NULL;

UPDATE profiles p
SET public_agent_code = yike_generate_public_agent_code(p.id)
WHERE public_agent_code IS NULL
  AND role IN ('agent', 'agent_unverified', 'agent_verified', 'admin', 'super_admin');

-- ── Concierge lead fields (property_leads spec on leads table) ───────────────

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS lead_code TEXT,
  ADD COLUMN IF NOT EXISTS public_listing_code TEXT,
  ADD COLUMN IF NOT EXISTS listing_slug TEXT,
  ADD COLUMN IF NOT EXISTS listing_url TEXT,
  ADD COLUMN IF NOT EXISTS listing_title TEXT,
  ADD COLUMN IF NOT EXISTS public_agent_code TEXT,
  ADD COLUMN IF NOT EXISTS agent_name TEXT,
  ADD COLUMN IF NOT EXISTS agent_whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS requester_name TEXT,
  ADD COLUMN IF NOT EXISTS requester_email TEXT,
  ADD COLUMN IF NOT EXISTS requester_phone TEXT,
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'whatsapp',
  ADD COLUMN IF NOT EXISTS concierge_status TEXT NOT NULL DEFAULT 'intent_created',
  ADD COLUMN IF NOT EXISTS handoff_message TEXT,
  ADD COLUMN IF NOT EXISTS handoff_url TEXT,
  ADD COLUMN IF NOT EXISTS handoff_copied_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS handoff_shared_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contacted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS leads_lead_code_idx
  ON leads (lead_code)
  WHERE lead_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS leads_public_listing_code_idx
  ON leads (public_listing_code, clicked_at DESC)
  WHERE public_listing_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS leads_public_agent_code_idx
  ON leads (public_agent_code, clicked_at DESC)
  WHERE public_agent_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS leads_concierge_status_idx
  ON leads (concierge_status, clicked_at DESC);

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_concierge_status_check;
ALTER TABLE leads
  ADD CONSTRAINT leads_concierge_status_check
  CHECK (concierge_status IN (
    'intent_created', 'user_messaged_yike', 'handoff_prepared', 'handoff_shared',
    'agent_contacted', 'qualified', 'closed_won', 'closed_lost', 'spam', 'cancelled'
  ));

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_channel_check;
ALTER TABLE leads
  ADD CONSTRAINT leads_channel_check
  CHECK (channel IN ('whatsapp', 'call', 'other'));

-- Backfill lead_code from yike_reference where missing
UPDATE leads
SET lead_code = 'YKLD' || upper(substr(replace(id::text, '-', ''), 1, 8))
WHERE lead_code IS NULL;

-- Compatibility view (read-only alias)
CREATE OR REPLACE VIEW property_leads AS
SELECT
  id,
  lead_code,
  listing_id,
  public_listing_code,
  listing_slug,
  listing_url,
  listing_title,
  agent_id,
  public_agent_code,
  agent_name,
  agent_whatsapp,
  user_id,
  guest_id AS visitor_id,
  requester_name,
  requester_email,
  requester_phone,
  requester_whatsapp,
  source_surface,
  source_page,
  source_campaign,
  channel,
  concierge_status AS status,
  handoff_message,
  handoff_url,
  handoff_copied_at,
  handoff_shared_at,
  contacted_by,
  internal_notes,
  charge_status,
  charge_amount,
  charged_at,
  clicked_at AS created_at,
  updated_at
FROM leads;

GRANT SELECT ON property_leads TO service_role;

CREATE OR REPLACE FUNCTION yike_generate_lead_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_code text;
  v_try int := 0;
BEGIN
  LOOP
    v_code := 'YKLD' || lpad((floor(random() * 1000000)::int)::text, 6, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM leads WHERE lead_code = v_code);
    v_try := v_try + 1;
    EXIT WHEN v_try > 100;
  END LOOP;
  RETURN v_code;
END;
$$;
