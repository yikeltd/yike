-- Controlled direct-call routing: agent eligibility, lead tracking, future billing

-- ── Agent call routing profile ──────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS allow_direct_calls BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS direct_call_enabled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS direct_call_enabled_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS direct_call_disabled_reason TEXT,
  ADD COLUMN IF NOT EXISTS call_routing_mode TEXT NOT NULL DEFAULT 'whatsapp_only',
  ADD COLUMN IF NOT EXISTS default_call_lead_price NUMERIC;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_call_routing_mode_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_call_routing_mode_check
  CHECK (call_routing_mode IN ('whatsapp_only', 'direct_calls', 'hybrid'));

-- ── Lead call tracking & future call billing ────────────────────────────────

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS inquiry_type TEXT,
  ADD COLUMN IF NOT EXISTS call_allowed BOOLEAN,
  ADD COLUMN IF NOT EXISTS call_opened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS call_route_reason TEXT,
  ADD COLUMN IF NOT EXISTS call_routing_mode_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS call_charge_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS call_charge_status TEXT NOT NULL DEFAULT 'not_chargeable',
  ADD COLUMN IF NOT EXISTS charged_for_call BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_inquiry_type_check;
ALTER TABLE leads
  ADD CONSTRAINT leads_inquiry_type_check
  CHECK (
    inquiry_type IS NULL
    OR inquiry_type IN ('whatsapp', 'direct_call', 'concierge_call')
  );

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_call_charge_status_check;
ALTER TABLE leads
  ADD CONSTRAINT leads_call_charge_status_check
  CHECK (call_charge_status IN (
    'not_chargeable', 'pending', 'charged', 'waived', 'failed'
  ));

CREATE INDEX IF NOT EXISTS leads_inquiry_type_idx
  ON leads (inquiry_type, clicked_at DESC)
  WHERE inquiry_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS leads_call_allowed_idx
  ON leads (call_allowed, clicked_at DESC)
  WHERE call_allowed IS NOT NULL;
