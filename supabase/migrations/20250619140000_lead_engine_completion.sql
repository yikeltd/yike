-- Lead engine completion: hot listing flag + extended property_leads view

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS hot_listing BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS properties_hot_listing_idx
  ON properties (hot_listing, updated_at DESC)
  WHERE hot_listing = TRUE;

DROP VIEW IF EXISTS property_leads;

CREATE VIEW property_leads AS
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
  inquiry_type,
  concierge_status AS status,
  handoff_message,
  handoff_url,
  handoff_copied_at,
  handoff_shared_at,
  call_allowed,
  call_opened_at,
  call_route_reason,
  call_routing_mode_snapshot,
  contacted_by,
  internal_notes,
  lead_quality_label,
  lead_quality_score,
  is_duplicate,
  duplicate_of_lead_id,
  dedupe_key,
  dedupe_window_expires_at,
  archived_at,
  archived_by,
  archive_reason,
  route_to,
  routing_reason,
  charge_status,
  charge_amount,
  charged_at,
  call_charge_status,
  call_charge_amount,
  charged_for_call,
  clicked_at AS created_at,
  updated_at
FROM leads;

GRANT SELECT ON property_leads TO service_role;
