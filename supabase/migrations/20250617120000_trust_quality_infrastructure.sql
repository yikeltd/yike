-- Trust + quality infrastructure (internal metrics, freshness, duplicates, attribution)

-- ── Profile: public slug + account readiness ────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS public_slug TEXT,
  ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS developer_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS agency_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS estate_project_name TEXT,
  ADD COLUMN IF NOT EXISTS is_responsive BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_account_type_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_account_type_check
  CHECK (account_type IN ('individual', 'agency', 'developer', 'landlord'));

CREATE UNIQUE INDEX IF NOT EXISTS profiles_public_slug_idx
  ON profiles (public_slug)
  WHERE public_slug IS NOT NULL;

-- Backfill slugs from name (best-effort; collisions resolved with suffix in app)
UPDATE profiles
SET public_slug = trim(both '-' from lower(regexp_replace(coalesce(full_name, id::text), '[^a-zA-Z0-9]+', '-', 'g')))
WHERE public_slug IS NULL
  AND full_name IS NOT NULL
  AND role IN ('agent', 'agent_unverified', 'agent_verified');

-- ── Agent trust metrics snapshot ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS agent_trust_metrics (
  profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  response_rate NUMERIC(5, 4) NOT NULL DEFAULT 0,
  avg_response_time_minutes NUMERIC(10, 2),
  verification_level TEXT,
  successful_inquiries INT NOT NULL DEFAULT 0,
  complaint_count INT NOT NULL DEFAULT 0,
  active_listing_count INT NOT NULL DEFAULT 0,
  rejected_listing_count INT NOT NULL DEFAULT 0,
  moderation_flags INT NOT NULL DEFAULT 0,
  stale_listing_ratio NUMERIC(5, 4) NOT NULL DEFAULT 0,
  trust_score NUMERIC(6, 2) NOT NULL DEFAULT 0,
  performance_score NUMERIC(6, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE agent_trust_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_trust_metrics_staff ON agent_trust_metrics
  FOR ALL USING (is_staff_admin());

-- ── Listing quality / freshness / duplicate flags ─────────────────────────────

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS last_refreshed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stale_score NUMERIC(5, 4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS auto_expire_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS listing_activity_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS possible_duplicate BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS duplicate_group_id UUID,
  ADD COLUMN IF NOT EXISTS duplicate_confidence_score NUMERIC(5, 4),
  ADD COLUMN IF NOT EXISTS listing_health_score INT,
  ADD COLUMN IF NOT EXISTS listing_quality_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS moderation_note TEXT;

ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_listing_activity_status_check;
ALTER TABLE properties
  ADD CONSTRAINT properties_listing_activity_status_check
  CHECK (listing_activity_status IN ('active', 'stale', 'inactive', 'archived'));

-- Soft moderation: flagged status
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_status_check;
ALTER TABLE properties
  ADD CONSTRAINT properties_status_check
  CHECK (status IN ('pending', 'approved', 'flagged', 'rejected', 'rented', 'hidden', 'archived'));

CREATE INDEX IF NOT EXISTS properties_flagged_idx
  ON properties (status, created_at DESC)
  WHERE status IN ('pending', 'flagged');

CREATE INDEX IF NOT EXISTS properties_duplicate_idx
  ON properties (possible_duplicate, duplicate_confidence_score DESC NULLS LAST)
  WHERE possible_duplicate = TRUE;

CREATE INDEX IF NOT EXISTS properties_health_idx
  ON properties (listing_health_score ASC NULLS LAST)
  WHERE status = 'approved';

UPDATE properties
SET last_refreshed_at = COALESCE(last_refreshed_at, updated_at)
WHERE last_refreshed_at IS NULL;

-- ── Lead inquiry + attribution ───────────────────────────────────────────────

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS response_time_minutes NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS inquiry_status TEXT NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS source_surface TEXT,
  ADD COLUMN IF NOT EXISTS source_listing_position INT,
  ADD COLUMN IF NOT EXISTS source_campaign TEXT;

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_inquiry_status_check;
ALTER TABLE leads
  ADD CONSTRAINT leads_inquiry_status_check
  CHECK (
    inquiry_status IN ('new', 'responded', 'resolved', 'ignored', 'spam')
  );

CREATE INDEX IF NOT EXISTS leads_inquiry_status_idx ON leads (inquiry_status, clicked_at DESC);
CREATE INDEX IF NOT EXISTS leads_source_surface_idx ON leads (source_surface, clicked_at DESC)
  WHERE source_surface IS NOT NULL;

-- ── Mark lead responded (support) ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION yike_mark_lead_responded(p_lead_id uuid, p_actor_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clicked timestamptz;
  v_agent_id uuid;
  v_mins numeric;
BEGIN
  SELECT clicked_at, agent_id INTO v_clicked, v_agent_id
  FROM leads WHERE id = p_lead_id;

  IF v_clicked IS NULL THEN
    RETURN;
  END IF;

  v_mins := EXTRACT(EPOCH FROM (NOW() - v_clicked)) / 60.0;

  UPDATE leads
  SET
    first_response_at = COALESCE(first_response_at, NOW()),
    response_time_minutes = COALESCE(response_time_minutes, v_mins),
    inquiry_status = CASE
      WHEN inquiry_status IN ('new', 'ignored') THEN 'responded'
      ELSE inquiry_status
    END
  WHERE id = p_lead_id AND first_response_at IS NULL;

  UPDATE profiles
  SET last_activity_at = NOW()
  WHERE id = v_agent_id;
END;
$$;

GRANT EXECUTE ON FUNCTION yike_mark_lead_responded(uuid, uuid) TO service_role;
