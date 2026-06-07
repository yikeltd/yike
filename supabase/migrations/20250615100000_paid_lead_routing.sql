-- Paid lead routing: modes, direct WhatsApp auth, wallets, dedup, charge tracking

-- ── Agent routing & billing profile ─────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS routing_mode TEXT NOT NULL DEFAULT 'yike_concierge',
  ADD COLUMN IF NOT EXISTS allow_direct_whatsapp BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS direct_whatsapp_enabled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS direct_whatsapp_enabled_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS direct_whatsapp_disabled_reason TEXT,
  ADD COLUMN IF NOT EXISTS billing_mode TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS default_lead_price NUMERIC,
  ADD COLUMN IF NOT EXISTS premium_lead_price NUMERIC,
  ADD COLUMN IF NOT EXISTS lead_billing_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS direct_routing_health_status TEXT NOT NULL DEFAULT 'healthy';

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_routing_mode_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_routing_mode_check
  CHECK (routing_mode IN ('yike_concierge', 'direct_whatsapp', 'hybrid'));

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_billing_mode_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_billing_mode_check
  CHECK (billing_mode IN ('free', 'pay_per_lead', 'subscription', 'manual_invoice', 'waived'));

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_direct_routing_health_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_direct_routing_health_check
  CHECK (direct_routing_health_status IN ('healthy', 'warning', 'disabled'));

-- ── Listing pricing overrides ───────────────────────────────────────────────

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS lead_price_override NUMERIC,
  ADD COLUMN IF NOT EXISTS premium_lead BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS requires_manual_review BOOLEAN NOT NULL DEFAULT FALSE;

-- ── Lead routing, dedup & charge fields ─────────────────────────────────────

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS is_duplicate BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS duplicate_of_lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS dedupe_key TEXT,
  ADD COLUMN IF NOT EXISTS dedupe_window_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS requester_whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS route_to TEXT,
  ADD COLUMN IF NOT EXISTS routing_mode_used TEXT,
  ADD COLUMN IF NOT EXISTS routing_reason TEXT,
  ADD COLUMN IF NOT EXISTS charge_status TEXT NOT NULL DEFAULT 'not_chargeable',
  ADD COLUMN IF NOT EXISTS charge_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS charged_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS charge_reference TEXT,
  ADD COLUMN IF NOT EXISTS billing_mode_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS wallet_balance_before NUMERIC,
  ADD COLUMN IF NOT EXISTS wallet_balance_after NUMERIC;

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_route_to_check;
ALTER TABLE leads
  ADD CONSTRAINT leads_route_to_check
  CHECK (route_to IS NULL OR route_to IN ('yike_support', 'direct_agent'));

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_charge_status_check;
ALTER TABLE leads
  ADD CONSTRAINT leads_charge_status_check
  CHECK (charge_status IN (
    'not_chargeable', 'pending', 'charged', 'waived', 'failed',
    'refunded', 'duplicate_no_charge', 'insufficient_balance'
  ));

CREATE INDEX IF NOT EXISTS leads_dedupe_key_idx
  ON leads (dedupe_key, clicked_at DESC)
  WHERE dedupe_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS leads_duplicate_idx
  ON leads (duplicate_of_lead_id)
  WHERE is_duplicate = TRUE;

-- ── Agent wallets ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS agent_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  balance NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_wallet_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('topup', 'lead_charge', 'refund', 'adjustment', 'waiver')),
  reason TEXT,
  reference TEXT,
  balance_before NUMERIC,
  balance_after NUMERIC,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agent_wallet_ledger_agent_idx
  ON agent_wallet_ledger (agent_id, created_at DESC);

ALTER TABLE agent_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_wallet_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_wallets_staff ON agent_wallets
  FOR ALL USING (is_staff_admin());

CREATE POLICY agent_wallet_ledger_staff ON agent_wallet_ledger
  FOR ALL USING (is_staff_admin());

-- Auto-create wallet row for agents (optional helper)
CREATE OR REPLACE FUNCTION yike_ensure_agent_wallet(p_agent_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO agent_wallets (agent_id)
  VALUES (p_agent_id)
  ON CONFLICT (agent_id) DO NOTHING;

  SELECT id INTO v_id FROM agent_wallets WHERE agent_id = p_agent_id;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION yike_ensure_agent_wallet(uuid) TO service_role;

-- Dedupe lookup within 7-day window
CREATE OR REPLACE FUNCTION yike_find_duplicate_lead(
  p_listing_id uuid,
  p_agent_id uuid,
  p_dedupe_key text,
  p_exclude_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM leads
  WHERE listing_id = p_listing_id
    AND agent_id = p_agent_id
    AND dedupe_key = p_dedupe_key
    AND clicked_at >= NOW() - INTERVAL '7 days'
    AND (p_exclude_id IS NULL OR id <> p_exclude_id)
    AND is_duplicate = FALSE
  ORDER BY clicked_at ASC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION yike_find_duplicate_lead(uuid, uuid, text, uuid) TO service_role;
