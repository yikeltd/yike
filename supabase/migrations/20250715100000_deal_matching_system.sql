-- High-intent deal matching — admin-controlled private deal flow

CREATE TABLE IF NOT EXISTS deal_matching_permissions (
  staff_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  can_manage_deal_matching BOOLEAN NOT NULL DEFAULT false,
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assignment_notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS deal_matching_permissions_active_idx
  ON deal_matching_permissions (is_active, can_manage_deal_matching)
  WHERE is_active = true AND can_manage_deal_matching = true;

CREATE TABLE IF NOT EXISTS deal_match_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN (
    'rent_request', 'buy_request', 'land_request', 'commercial_request',
    'office_request', 'relocation_request', 'premium_request'
  )),
  request_source TEXT NOT NULL CHECK (request_source IN (
    'user_search_behavior', 'user_submission', 'whatsapp_request', 'admin_manual',
    'relocation_assistance', 'diaspora_request', 'property_verification_followup'
  )),
  target_area TEXT,
  city TEXT,
  state TEXT,
  property_type TEXT,
  budget_min BIGINT,
  budget_max BIGINT,
  requirements TEXT,
  internal_notes TEXT,
  urgency TEXT NOT NULL DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'urgent')),
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'internal')),
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN (
    'created', 'outreach_sent', 'agent_responded', 'buyer_contacted',
    'negotiation_started', 'verification_requested', 'legal_review_requested',
    'closed_successfully', 'failed', 'abandoned'
  )),
  expected_transaction_value BIGINT,
  estimated_commission BIGINT,
  agreed_percentage NUMERIC(5, 2),
  commission_status TEXT NOT NULL DEFAULT 'pending' CHECK (commission_status IN (
    'pending', 'estimated', 'agreed', 'invoiced', 'paid', 'waived'
  )),
  payment_status TEXT NOT NULL DEFAULT 'none' CHECK (payment_status IN (
    'none', 'pending', 'partial', 'paid', 'refunded'
  )),
  negotiation_notes TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  assigned_support_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS deal_match_requests_status_idx ON deal_match_requests (status, updated_at DESC);
CREATE INDEX IF NOT EXISTS deal_match_requests_area_idx ON deal_match_requests (state, city, target_area);
CREATE INDEX IF NOT EXISTS deal_match_requests_assigned_idx ON deal_match_requests (assigned_support_id, status);

CREATE TABLE IF NOT EXISTS deal_match_outreach (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES deal_match_requests(id) ON DELETE CASCADE,
  recipient_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('agent', 'company', 'user')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'sent', 'responded', 'declined', 'excluded'
  )),
  notification_campaign_id UUID REFERENCES admin_notification_campaigns(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  excluded_reason TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (request_id, recipient_user_id)
);

CREATE INDEX IF NOT EXISTS deal_match_outreach_request_idx ON deal_match_outreach (request_id, status);
CREATE INDEX IF NOT EXISTS deal_match_outreach_recipient_idx ON deal_match_outreach (recipient_user_id, status);

CREATE TABLE IF NOT EXISTS deal_match_status_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES deal_match_requests(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS deal_match_status_events_request_idx
  ON deal_match_status_events (request_id, created_at DESC);

ALTER TABLE deal_matching_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_match_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_match_outreach ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_match_status_events ENABLE ROW LEVEL SECURITY;

-- Staff admin client bypasses RLS; block public/anon access
CREATE POLICY deal_matching_permissions_deny_anon ON deal_matching_permissions
  FOR ALL USING (false);

CREATE POLICY deal_match_requests_deny_anon ON deal_match_requests
  FOR ALL USING (false);

CREATE POLICY deal_match_outreach_deny_anon ON deal_match_outreach
  FOR ALL USING (false);

CREATE POLICY deal_match_status_events_deny_anon ON deal_match_status_events
  FOR ALL USING (false);
