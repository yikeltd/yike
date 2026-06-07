-- Listing value drivers — structured "why this price" features with moderation

CREATE TABLE IF NOT EXISTS listing_value_drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  driver_key TEXT NOT NULL,
  label TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'approved', 'rejected', 'requires_evidence')),
  submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  evidence_url TEXT,
  evidence_requested BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (listing_id, driver_key)
);

CREATE INDEX IF NOT EXISTS listing_value_drivers_listing_idx
  ON listing_value_drivers (listing_id, created_at DESC);

CREATE INDEX IF NOT EXISTS listing_value_drivers_status_idx
  ON listing_value_drivers (listing_id, status);

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS value_drivers_status TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS approved_value_driver_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_value_drivers_status_check;
ALTER TABLE properties
  ADD CONSTRAINT properties_value_drivers_status_check
  CHECK (value_drivers_status IN ('none', 'pending_review', 'approved', 'rejected', 'partially_approved'));

CREATE OR REPLACE FUNCTION yike_refresh_listing_value_driver_summary(p_listing_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total INTEGER;
  v_approved INTEGER;
  v_pending INTEGER;
  v_rejected INTEGER;
  v_status TEXT;
BEGIN
  SELECT
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE status = 'approved')::INTEGER,
    COUNT(*) FILTER (WHERE status IN ('pending_review', 'requires_evidence'))::INTEGER,
    COUNT(*) FILTER (WHERE status = 'rejected')::INTEGER
  INTO v_total, v_approved, v_pending, v_rejected
  FROM listing_value_drivers
  WHERE listing_id = p_listing_id;

  IF v_total = 0 THEN
    v_status := 'none';
  ELSIF v_approved = v_total THEN
    v_status := 'approved';
  ELSIF v_rejected = v_total THEN
    v_status := 'rejected';
  ELSIF v_approved > 0 AND (v_pending > 0 OR v_rejected > 0) THEN
    v_status := 'partially_approved';
  ELSIF v_pending > 0 THEN
    v_status := 'pending_review';
  ELSE
    v_status := 'partially_approved';
  END IF;

  UPDATE properties
  SET
    value_drivers_status = v_status,
    approved_value_driver_count = v_approved,
    updated_at = NOW()
  WHERE id = p_listing_id;
END;
$$;

ALTER TABLE listing_value_drivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS listing_value_drivers_staff ON listing_value_drivers;
CREATE POLICY listing_value_drivers_staff ON listing_value_drivers
  FOR ALL USING (is_staff_admin());

DROP POLICY IF EXISTS listing_value_drivers_agent_select ON listing_value_drivers;
CREATE POLICY listing_value_drivers_agent_select ON listing_value_drivers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = listing_value_drivers.listing_id
        AND p.agent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS listing_value_drivers_agent_write ON listing_value_drivers;
CREATE POLICY listing_value_drivers_agent_write ON listing_value_drivers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = listing_value_drivers.listing_id
        AND p.agent_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = listing_value_drivers.listing_id
        AND p.agent_id = auth.uid()
    )
  );
