-- Progressive trust: agent tiers, listing limits, monetization foundation

-- Profiles: tier fields
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS listing_limit INT,
  ADD COLUMN IF NOT EXISTS ranking_score INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verified_badge BOOLEAN NOT NULL DEFAULT FALSE;

-- Drop legacy role constraint before tier migration
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Migrate legacy agent role → tiered roles
UPDATE profiles
SET
  role = 'agent_verified',
  verified_badge = TRUE,
  listing_limit = NULL,
  ranking_score = GREATEST(ranking_score, 100)
WHERE role = 'agent'
  AND verification_status IN ('approved', 'verified');

UPDATE profiles
SET
  role = 'agent_unverified',
  verified_badge = FALSE,
  listing_limit = COALESCE(listing_limit, 5),
  ranking_score = GREATEST(ranking_score, 0)
WHERE role = 'agent'
  AND verification_status NOT IN ('approved', 'verified');

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    'user',
    'agent_unverified',
    'agent_verified',
    'admin',
    'super_admin'
  ));

-- Properties: featured / boost / sponsored foundation
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS boost_score INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sponsored_status TEXT NOT NULL DEFAULT 'none';

ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_sponsored_status_check;
ALTER TABLE properties
  ADD CONSTRAINT properties_sponsored_status_check
  CHECK (sponsored_status IN ('none', 'sponsored', 'boosted'));

CREATE INDEX IF NOT EXISTS properties_boost_idx
  ON properties (status, boost_score DESC, is_featured DESC, created_at DESC)
  WHERE status = 'approved';

-- Listing insert: unverified + verified agents (phone/email verified at app layer)
DROP POLICY IF EXISTS "Verified listers insert own listings" ON properties;
CREATE POLICY "Agent listers insert own listings"
  ON properties FOR INSERT
  WITH CHECK (
    agent_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('agent_unverified', 'agent_verified')
        AND is_banned = FALSE
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
        AND is_banned = FALSE
    )
  );

-- Enforce unverified agent listing cap (pending + approved, non-expired)
CREATE OR REPLACE FUNCTION check_agent_listing_limit()
RETURNS TRIGGER AS $$
DECLARE
  prof RECORD;
  active_count INT;
  cap INT;
BEGIN
  SELECT role, listing_limit, verified_badge, verification_status
  INTO prof
  FROM profiles
  WHERE id = NEW.agent_id;

  IF prof IS NULL THEN
    RAISE EXCEPTION 'Agent profile not found';
  END IF;

  IF prof.role IN ('admin', 'super_admin', 'agent_verified')
     OR prof.verified_badge = TRUE
     OR prof.verification_status IN ('approved', 'verified') THEN
    RETURN NEW;
  END IF;

  IF prof.role <> 'agent_unverified' THEN
    RAISE EXCEPTION 'Only agents can create listings';
  END IF;

  cap := COALESCE(prof.listing_limit, 5);

  SELECT COUNT(*)::INT INTO active_count
  FROM properties
  WHERE agent_id = NEW.agent_id
    AND status IN ('pending', 'approved')
    AND expires_at > NOW();

  IF active_count >= cap THEN
    RAISE EXCEPTION 'Listing limit reached (%). Verify your agent profile for unlimited listings.', cap;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_agent_listing_limit ON properties;
CREATE TRIGGER enforce_agent_listing_limit
  BEFORE INSERT ON properties
  FOR EACH ROW
  EXECUTE FUNCTION check_agent_listing_limit();
