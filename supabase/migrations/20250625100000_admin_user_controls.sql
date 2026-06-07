-- Admin user/agent controls: account status, listing limits, notes, abuse flags

ALTER TYPE agent_profile_status ADD VALUE IF NOT EXISTS 'on_hold';
ALTER TYPE agent_profile_status ADD VALUE IF NOT EXISTS 'pending_verification';

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS account_status TEXT,
  ADD COLUMN IF NOT EXISTS listing_limit_reason TEXT,
  ADD COLUMN IF NOT EXISTS listing_limit_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS listing_limit_updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verification_required BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS abuse_review_flag BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS abuse_review_reason TEXT,
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

UPDATE profiles
SET account_status = CASE
  WHEN profile_status::text = 'reinstated' THEN 'active'
  ELSE profile_status::text
END
WHERE account_status IS NULL;

ALTER TABLE profiles
  ALTER COLUMN account_status SET DEFAULT 'active';

CREATE TABLE IF NOT EXISTS admin_user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  body TEXT NOT NULL CHECK (char_length(body) >= 1 AND char_length(body) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_user_notes_target_idx
  ON admin_user_notes (target_user_id, created_at DESC);

ALTER TABLE admin_user_notes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS admin_verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS admin_verification_requests_user_idx
  ON admin_verification_requests (user_id, created_at DESC);

ALTER TABLE admin_verification_requests ENABLE ROW LEVEL SECURITY;

-- Sync account_status from profile_status
CREATE OR REPLACE FUNCTION sync_profile_account_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.account_status := CASE
    WHEN NEW.profile_status::text = 'reinstated' THEN 'active'
    ELSE NEW.profile_status::text
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_sync_account_status ON profiles;
CREATE TRIGGER profiles_sync_account_status
  BEFORE INSERT OR UPDATE OF profile_status ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_account_status();

-- Enforce listing limits + account status on publish/create
CREATE OR REPLACE FUNCTION check_agent_listing_limit()
RETURNS TRIGGER AS $$
DECLARE
  prof RECORD;
  active_count INT;
  cap INT;
  acct TEXT;
BEGIN
  SELECT
    role, listing_limit, verified_badge, verification_status,
    profile_status, account_status, verification_required, is_banned
  INTO prof
  FROM profiles
  WHERE id = NEW.agent_id;

  IF prof IS NULL THEN
    RAISE EXCEPTION 'Agent profile not found';
  END IF;

  IF prof.is_banned THEN
    RAISE EXCEPTION 'Account restricted. Contact Yike support.';
  END IF;

  acct := COALESCE(prof.account_status, prof.profile_status::text, 'active');

  IF acct IN ('suspended', 'deleted') THEN
    RAISE EXCEPTION 'Account restricted. Contact Yike support.';
  END IF;

  IF acct IN ('on_hold', 'pending_verification')
     OR (prof.verification_required AND acct <> 'active') THEN
    RAISE EXCEPTION 'Your account is under review. Contact Yike to verify or restore posting.';
  END IF;

  IF prof.role IN ('admin', 'super_admin') THEN
    RETURN NEW;
  END IF;

  IF prof.role NOT IN ('agent_unverified', 'agent_verified', 'agent') THEN
    RAISE EXCEPTION 'Only agents can create listings';
  END IF;

  IF prof.listing_limit IS NOT NULL THEN
    cap := prof.listing_limit;
  ELSIF prof.role = 'agent_verified'
        OR prof.verified_badge = TRUE
        OR prof.verification_status IN ('approved', 'verified') THEN
    RETURN NEW;
  ELSE
    cap := 5;
  END IF;

  SELECT COUNT(*)::INT INTO active_count
  FROM properties
  WHERE agent_id = NEW.agent_id
    AND status IN ('pending', 'approved')
    AND expires_at > NOW();

  IF active_count >= cap THEN
    RAISE EXCEPTION 'Listing limit reached (%). Verify your account or contact Yike for an upgrade.', cap;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_agent_listing_limit ON properties;
CREATE TRIGGER enforce_agent_listing_limit
  BEFORE INSERT ON properties
  FOR EACH ROW
  EXECUTE FUNCTION check_agent_listing_limit();

-- Abuse flag helper (call from app or cron)
CREATE OR REPLACE FUNCTION yike_refresh_abuse_review_flag(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_open_reports int;
  v_rejected int;
BEGIN
  SELECT COUNT(*)::int INTO v_open_reports
  FROM listing_reports lr
  JOIN properties p ON p.id = lr.property_id
  WHERE p.agent_id = p_user_id AND lr.status = 'open';

  SELECT COUNT(*)::int INTO v_rejected
  FROM properties
  WHERE agent_id = p_user_id AND status = 'rejected';

  UPDATE profiles
  SET
    abuse_review_flag = (v_open_reports >= 3 OR v_open_reports >= 5),
    abuse_review_reason = CASE
      WHEN v_open_reports >= 5 THEN '5+ open listing reports — review recommended'
      WHEN v_open_reports >= 3 THEN '3+ open listing reports — flagged for review'
      WHEN v_rejected >= 5 THEN 'Multiple rejected listings'
      ELSE NULL
    END
  WHERE id = p_user_id;
END;
$$;
