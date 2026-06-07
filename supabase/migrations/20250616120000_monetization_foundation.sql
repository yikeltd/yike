-- Monetization foundation: featured metadata, inspection requests, deal tracking

-- ── Featured promotion metadata ─────────────────────────────────────────────

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS featured_tier TEXT,
  ADD COLUMN IF NOT EXISTS featured_reason TEXT,
  ADD COLUMN IF NOT EXISTS featured_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS featured_created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS yike_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS yike_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS yike_verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS yike_verification_level TEXT,
  ADD COLUMN IF NOT EXISTS is_premium_deal BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS developer_partner_id UUID,
  ADD COLUMN IF NOT EXISTS expected_commission_rate NUMERIC(5, 4),
  ADD COLUMN IF NOT EXISTS closing_tracking_enabled BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_featured_tier_check;
ALTER TABLE properties
  ADD CONSTRAINT properties_featured_tier_check
  CHECK (featured_tier IS NULL OR featured_tier IN ('basic', 'premium', 'launch', 'developer'));

ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_yike_verification_level_check;
ALTER TABLE properties
  ADD CONSTRAINT properties_yike_verification_level_check
  CHECK (
    yike_verification_level IS NULL
    OR yike_verification_level IN ('basic', 'physical', 'document_review', 'developer_partner')
  );

CREATE INDEX IF NOT EXISTS properties_active_featured_idx
  ON properties (is_featured, featured_until DESC NULLS LAST)
  WHERE status = 'approved' AND is_featured = TRUE;

CREATE INDEX IF NOT EXISTS properties_premium_deal_idx
  ON properties (is_premium_deal, closing_tracking_enabled)
  WHERE is_premium_deal = TRUE OR closing_tracking_enabled = TRUE;

-- ── Lead / deal tracking fields ─────────────────────────────────────────────

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS lead_source TEXT NOT NULL DEFAULT 'yike',
  ADD COLUMN IF NOT EXISTS inquiry_channel TEXT,
  ADD COLUMN IF NOT EXISTS lead_status TEXT NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS transaction_stage TEXT,
  ADD COLUMN IF NOT EXISTS estimated_budget NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS potential_deal_value NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS developer_partner_id UUID,
  ADD COLUMN IF NOT EXISTS internal_notes TEXT;

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_lead_status_check;
ALTER TABLE leads
  ADD CONSTRAINT leads_lead_status_check
  CHECK (
    lead_status IN (
      'new', 'contacted', 'qualified', 'inspection_requested',
      'negotiation', 'closed_won', 'closed_lost', 'spam'
    )
  );

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_transaction_stage_check;
ALTER TABLE leads
  ADD CONSTRAINT leads_transaction_stage_check
  CHECK (
    transaction_stage IS NULL
    OR transaction_stage IN (
      'inquiry', 'inspection', 'offer', 'due_diligence', 'agreement', 'payment', 'closed'
    )
  );

CREATE INDEX IF NOT EXISTS leads_lead_status_idx ON leads (lead_status, clicked_at DESC);
CREATE INDEX IF NOT EXISTS leads_premium_deal_idx ON leads (potential_deal_value DESC NULLS LAST)
  WHERE potential_deal_value IS NOT NULL;

-- Backfill inquiry channel from lead_type
UPDATE leads
SET inquiry_channel = lead_type
WHERE inquiry_channel IS NULL;

-- ── Inspection requests ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS inspection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requester_name TEXT,
  requester_email TEXT,
  requester_phone TEXT,
  requester_whatsapp TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'normal',
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  inspection_fee_amount NUMERIC(12, 2),
  payment_status TEXT NOT NULL DEFAULT 'not_requested',
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  admin_notes TEXT,
  user_note TEXT,
  scout_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE inspection_requests DROP CONSTRAINT IF EXISTS inspection_requests_status_check;
ALTER TABLE inspection_requests
  ADD CONSTRAINT inspection_requests_status_check
  CHECK (
    status IN ('pending', 'contacted', 'assigned', 'scheduled', 'completed', 'rejected', 'cancelled')
  );

ALTER TABLE inspection_requests DROP CONSTRAINT IF EXISTS inspection_requests_priority_check;
ALTER TABLE inspection_requests
  ADD CONSTRAINT inspection_requests_priority_check
  CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

ALTER TABLE inspection_requests DROP CONSTRAINT IF EXISTS inspection_requests_payment_status_check;
ALTER TABLE inspection_requests
  ADD CONSTRAINT inspection_requests_payment_status_check
  CHECK (
    payment_status IN ('not_requested', 'requested', 'paid', 'waived', 'refunded')
  );

CREATE INDEX IF NOT EXISTS inspection_requests_listing_idx
  ON inspection_requests (listing_id, created_at DESC);

CREATE INDEX IF NOT EXISTS inspection_requests_status_idx
  ON inspection_requests (status, created_at DESC);

CREATE INDEX IF NOT EXISTS inspection_requests_user_idx
  ON inspection_requests (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

ALTER TABLE inspection_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY inspection_requests_insert_auth ON inspection_requests
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY inspection_requests_select_own ON inspection_requests
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY inspection_requests_staff ON inspection_requests
  FOR ALL
  USING (is_staff_admin());

-- ── Updated lead logging ────────────────────────────────────────────────────

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
  PERFORM yike_check_lead_cooldown(p_user_id, p_guest_id, p_user_ip_hash, p_listing_id);

  INSERT INTO leads (
    user_id, guest_id, user_ip_hash, listing_id, agent_id,
    lead_type, source_page, message, yike_reference, user_agent, status,
    lead_source, inquiry_channel, lead_status
  ) VALUES (
    p_user_id, p_guest_id, p_user_ip_hash, p_listing_id, p_agent_id,
    p_lead_type, p_source_page, p_message, p_yike_reference, p_user_agent, 'clicked',
    'yike', p_lead_type, 'new'
  )
  RETURNING id INTO v_id;

  PERFORM yike_insert_lead_event(v_id, 'lead_created', p_user_id, 'user', '{}');

  UPDATE profiles
  SET
    inquiry_count = inquiry_count + 1,
    last_activity_at = NOW()
  WHERE id = p_agent_id;

  RETURN v_id;
END;
$$;
