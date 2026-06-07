-- WhatsApp lead operations: cooldown, availability, quality, timeline, support tools

-- ── Agent availability & performance ──────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS availability_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS availability_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_verified_agent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verified_agent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_agent_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verification_level TEXT,
  ADD COLUMN IF NOT EXISTS inquiry_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_response_time_minutes NUMERIC,
  ADD COLUMN IF NOT EXISTS response_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS successful_handoffs INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS complaint_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS spam_lead_ratio NUMERIC,
  ADD COLUMN IF NOT EXISTS stale_listing_ratio NUMERIC,
  ADD COLUMN IF NOT EXISTS performance_score NUMERIC,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_availability_status_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_availability_status_check
  CHECK (availability_status IN ('active', 'offline', 'unavailable', 'suspended'));

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_verification_level_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_verification_level_check
  CHECK (
    verification_level IS NULL
    OR verification_level IN ('basic', 'identity_verified', 'business_verified', 'yike_partner')
  );

-- ── Listing operational availability (separate from moderation status) ────────

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS availability_status TEXT NOT NULL DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS availability_updated_at TIMESTAMPTZ;

ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_availability_status_check;
ALTER TABLE properties
  ADD CONSTRAINT properties_availability_status_check
  CHECK (
    availability_status IN (
      'available', 'reserved', 'rented', 'sold', 'unavailable', 'hidden', 'under_review'
    )
  );

CREATE INDEX IF NOT EXISTS properties_availability_idx
  ON properties (availability_status, status)
  WHERE status = 'approved';

-- ── Lead operational fields ─────────────────────────────────────────────────

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS lead_quality_label TEXT,
  ADD COLUMN IF NOT EXISTS lead_quality_score NUMERIC,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archive_reason TEXT,
  ADD COLUMN IF NOT EXISTS requires_manual_review BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS premium_lead BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS assigned_support_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_quality_label_check;
ALTER TABLE leads
  ADD CONSTRAINT leads_quality_label_check
  CHECK (
    lead_quality_label IS NULL
    OR lead_quality_label IN (
      'serious', 'inspection_ready', 'spam', 'duplicate',
      'low_intent', 'premium', 'developer_interest'
    )
  );

CREATE INDEX IF NOT EXISTS leads_active_queue_idx
  ON leads (clicked_at DESC)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS leads_cooldown_listing_idx
  ON leads (listing_id, user_ip_hash, guest_id, clicked_at DESC);

CREATE INDEX IF NOT EXISTS leads_cooldown_global_idx
  ON leads (user_ip_hash, guest_id, user_id, clicked_at DESC);

-- ── Lead timeline ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lead_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_role TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lead_events_lead_idx ON lead_events (lead_id, created_at ASC);
CREATE INDEX IF NOT EXISTS lead_events_type_idx ON lead_events (type, created_at DESC);

-- ── Support quick replies ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS support_quick_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS support_quick_replies_title_uidx
  ON support_quick_replies (title);

CREATE INDEX IF NOT EXISTS support_quick_replies_active_idx
  ON support_quick_replies (active, title);

-- ── Internal agent/profile notes ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS internal_profile_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  visibility TEXT NOT NULL DEFAULT 'internal_only',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS internal_profile_notes_profile_idx
  ON internal_profile_notes (profile_id, created_at DESC);

-- ── Cooldown check ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION yike_check_lead_cooldown(
  p_user_id uuid,
  p_guest_id text,
  p_user_ip_hash text,
  p_listing_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing_limit int;
  v_global_limit int;
  v_listing_count int;
  v_global_count int;
  v_since_listing timestamptz := NOW() - INTERVAL '30 minutes';
  v_since_day timestamptz := NOW() - INTERVAL '24 hours';
BEGIN
  IF p_user_id IS NOT NULL THEN
    v_listing_limit := 5;
    v_global_limit := 35;
  ELSE
    v_listing_limit := 3;
    v_global_limit := 20;
  END IF;

  SELECT COUNT(*)::int INTO v_listing_count
  FROM leads
  WHERE listing_id = p_listing_id
    AND clicked_at >= v_since_listing
    AND (
      (p_user_id IS NOT NULL AND user_id = p_user_id)
      OR (p_guest_id IS NOT NULL AND guest_id = p_guest_id)
      OR (p_user_ip_hash IS NOT NULL AND user_ip_hash = p_user_ip_hash)
    );

  IF v_listing_count >= v_listing_limit THEN
    RAISE EXCEPTION 'lead_cooldown_listing';
  END IF;

  SELECT COUNT(*)::int INTO v_global_count
  FROM leads
  WHERE clicked_at >= v_since_day
    AND (
      (p_user_id IS NOT NULL AND user_id = p_user_id)
      OR (p_guest_id IS NOT NULL AND guest_id = p_guest_id)
      OR (p_user_ip_hash IS NOT NULL AND user_ip_hash = p_user_ip_hash)
    );

  IF v_global_count >= v_global_limit THEN
    RAISE EXCEPTION 'lead_cooldown_global';
  END IF;
END;
$$;

-- ── Lead event helper ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION yike_insert_lead_event(
  p_lead_id uuid,
  p_type text,
  p_actor_id uuid DEFAULT NULL,
  p_actor_role text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO lead_events (lead_id, type, actor_id, actor_role, metadata)
  VALUES (p_lead_id, p_type, p_actor_id, p_actor_role, COALESCE(p_metadata, '{}'))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ── Updated lead logging with cooldown + timeline ───────────────────────────

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
    lead_type, source_page, message, yike_reference, user_agent, status
  ) VALUES (
    p_user_id, p_guest_id, p_user_ip_hash, p_listing_id, p_agent_id,
    p_lead_type, p_source_page, p_message, p_yike_reference, p_user_agent, 'clicked'
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

GRANT EXECUTE ON FUNCTION yike_check_lead_cooldown(uuid, text, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION yike_insert_lead_event(uuid, text, uuid, text, jsonb) TO service_role;

-- ── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE lead_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_quick_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_profile_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY lead_events_staff ON lead_events
  FOR ALL USING (is_staff_admin());

CREATE POLICY support_quick_replies_staff ON support_quick_replies
  FOR ALL USING (is_staff_admin());

CREATE POLICY internal_profile_notes_staff ON internal_profile_notes
  FOR ALL USING (is_staff_admin());

CREATE POLICY leads_staff_select ON leads
  FOR SELECT USING (is_staff_admin());

CREATE POLICY leads_staff_update ON leads
  FOR UPDATE USING (is_staff_admin());

-- ── Seed default quick replies ──────────────────────────────────────────────

INSERT INTO support_quick_replies (title, body, active) VALUES
(
  'Initial welcome',
  E'Hi! Thanks for reaching out through Yike.\n\nI''ve received your property inquiry and I''m here to help.\n\nFor your safety, please confirm property details and avoid making payments without proper verification.',
  TRUE
),
(
  'Agent handoff',
  E'I''m connecting you with the listing agent now. They''ll follow up on WhatsApp shortly.\n\nFor your safety, please confirm property details and avoid making payments without proper verification.',
  TRUE
),
(
  'Property unavailable',
  E'Thanks for your interest. This property may no longer be available, but I can share similar options in the same area.\n\nFor your safety, please confirm property details and avoid making payments without proper verification.',
  TRUE
),
(
  'Verification request',
  E'Before proceeding, please confirm you''d like to schedule a physical inspection. Never pay inspection fees upfront.\n\nFor your safety, please confirm property details and avoid making payments without proper verification.',
  TRUE
),
(
  'Similar listings',
  E'I can share a few similar homes in the same area and budget. Would you like rent or sale listings?\n\nFor your safety, please confirm property details and avoid making payments without proper verification.',
  TRUE
),
(
  'Follow-up reminder',
  E'Just checking in — did you get a chance to speak with the agent about this property?\n\nFor your safety, please confirm property details and avoid making payments without proper verification.',
  TRUE
),
(
  'Inspection scheduling',
  E'Great — let''s arrange a physical viewing. Please inspect the property in person before any payment.\n\nFor your safety, please confirm property details and avoid making payments without proper verification.',
  TRUE
)
ON CONFLICT (title) DO NOTHING;
