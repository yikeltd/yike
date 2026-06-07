-- Enforce listing limits on restore/republish (UPDATE), not only INSERT

CREATE OR REPLACE FUNCTION check_agent_listing_limit()
RETURNS TRIGGER AS $$
DECLARE
  prof RECORD;
  active_count INT;
  cap INT;
  acct TEXT;
  becoming_active BOOLEAN;
  was_active BOOLEAN;
BEGIN
  becoming_active :=
    NEW.status IN ('pending', 'approved')
    AND NEW.expires_at > NOW();

  IF TG_OP = 'UPDATE' THEN
    was_active :=
      OLD.status IN ('pending', 'approved')
      AND OLD.expires_at > NOW();
    IF NOT becoming_active OR was_active THEN
      RETURN NEW;
    END IF;
  END IF;

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
    AND expires_at > NOW()
    AND (TG_OP = 'INSERT' OR id <> NEW.id);

  IF active_count >= cap THEN
    RAISE EXCEPTION 'Listing limit reached (%). Verify your account or contact Yike for an upgrade.', cap;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_agent_listing_limit_update ON properties;
CREATE TRIGGER enforce_agent_listing_limit_update
  BEFORE UPDATE OF status, expires_at ON properties
  FOR EACH ROW
  EXECUTE FUNCTION check_agent_listing_limit();
