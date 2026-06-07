-- Lead routing hardening: disputes, receipts, notifications

-- ── Dispute fields ──────────────────────────────────────────────────────────

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS dispute_status TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS dispute_reason TEXT,
  ADD COLUMN IF NOT EXISTS disputed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dispute_resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dispute_resolution TEXT,
  ADD COLUMN IF NOT EXISTS agent_notified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notification_channel TEXT,
  ADD COLUMN IF NOT EXISTS notification_status TEXT;

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_dispute_status_check;
ALTER TABLE leads
  ADD CONSTRAINT leads_dispute_status_check
  CHECK (dispute_status IN (
    'none', 'opened', 'under_review', 'approved_refund', 'rejected', 'resolved'
  ));

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_dispute_reason_check;
ALTER TABLE leads
  ADD CONSTRAINT leads_dispute_reason_check
  CHECK (
    dispute_reason IS NULL
    OR dispute_reason IN (
      'duplicate', 'fake_user', 'wrong_number', 'spam',
      'property_unavailable', 'agent_not_responsible'
    )
  );

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_notification_channel_check;
ALTER TABLE leads
  ADD CONSTRAINT leads_notification_channel_check
  CHECK (
    notification_channel IS NULL
    OR notification_channel IN ('whatsapp', 'email', 'dashboard', 'manual')
  );

CREATE INDEX IF NOT EXISTS leads_dispute_status_idx
  ON leads (dispute_status, disputed_at DESC)
  WHERE dispute_status <> 'none';

-- ── Internal lead receipts (admin-only) ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS agent_lead_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  charge_amount NUMERIC NOT NULL DEFAULT 0,
  charge_status TEXT NOT NULL,
  route_used TEXT,
  is_duplicate BOOLEAN NOT NULL DEFAULT FALSE,
  yike_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agent_lead_receipts_agent_idx
  ON agent_lead_receipts (agent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS agent_lead_receipts_lead_idx
  ON agent_lead_receipts (lead_id);

ALTER TABLE agent_lead_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_lead_receipts_staff ON agent_lead_receipts
  FOR ALL USING (is_staff_admin());

-- Wallet ledger reference column if missing
ALTER TABLE agent_wallet_ledger
  ADD COLUMN IF NOT EXISTS note TEXT;
