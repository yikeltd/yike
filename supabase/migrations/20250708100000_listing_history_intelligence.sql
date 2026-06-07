-- Listing history & market memory — event log + cached summary on properties

CREATE TABLE IF NOT EXISTS listing_history_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_role TEXT,
  source TEXT,
  public_visible BOOLEAN NOT NULL DEFAULT false,
  internal_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS listing_history_events_listing_idx
  ON listing_history_events (listing_id, created_at DESC);

CREATE INDEX IF NOT EXISTS listing_history_events_type_idx
  ON listing_history_events (listing_id, event_type);

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS price_change_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_price_changed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_status_changed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS history_summary_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS had_unavailable_state BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reactivation_count INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION yike_refresh_listing_history_summary(p_listing_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE properties p
  SET
    price_change_count = COALESCE(
      (SELECT COUNT(*)::INTEGER FROM listing_history_events e
       WHERE e.listing_id = p_listing_id AND e.event_type = 'price_changed'),
      0
    ),
    last_price_changed_at = (
      SELECT MAX(created_at) FROM listing_history_events e
      WHERE e.listing_id = p_listing_id AND e.event_type = 'price_changed'
    ),
    last_status_changed_at = (
      SELECT MAX(created_at) FROM listing_history_events e
      WHERE e.listing_id = p_listing_id
        AND e.event_type IN ('status_changed', 'marked_rented', 'marked_sold', 'marked_unavailable')
    ),
    last_verified_at = COALESCE(
      p.yike_verified_at,
      (SELECT MAX(created_at) FROM listing_history_events e
       WHERE e.listing_id = p_listing_id
         AND e.event_type IN ('verified_physical', 'legal_review_completed'))
    ),
    reactivation_count = COALESCE(
      (SELECT COUNT(*)::INTEGER FROM listing_history_events e
       WHERE e.listing_id = p_listing_id AND e.event_type = 'reactivated'),
      0
    ),
    had_unavailable_state = EXISTS (
      SELECT 1 FROM listing_history_events e
      WHERE e.listing_id = p_listing_id
        AND e.event_type IN ('marked_unavailable', 'marked_rented', 'marked_sold', 'expired')
    ),
    history_summary_updated_at = NOW()
  WHERE p.id = p_listing_id;
END;
$$;

CREATE OR REPLACE FUNCTION yike_insert_listing_history_event(
  p_listing_id UUID,
  p_event_type TEXT,
  p_old_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL,
  p_actor_role TEXT DEFAULT NULL,
  p_source TEXT DEFAULT 'system',
  p_public_visible BOOLEAN DEFAULT false,
  p_internal_note TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO listing_history_events (
    listing_id, event_type, old_value, new_value,
    actor_id, actor_role, source, public_visible, internal_note
  ) VALUES (
    p_listing_id, p_event_type, p_old_value, p_new_value,
    p_actor_id, p_actor_role, p_source, p_public_visible, p_internal_note
  )
  RETURNING id INTO v_id;

  PERFORM yike_refresh_listing_history_summary(p_listing_id);
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION yike_properties_history_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_public BOOLEAN := false;
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM yike_insert_listing_history_event(
      NEW.id, 'listing_created', NULL,
      jsonb_build_object('status', NEW.status, 'price', NEW.price),
      NEW.agent_id, 'agent', 'db_trigger', false, NULL
    );
    IF NEW.status = 'approved' THEN
      PERFORM yike_insert_listing_history_event(
        NEW.id, 'listing_published', NULL,
        jsonb_build_object('status', NEW.status),
        NEW.agent_id, 'agent', 'db_trigger', false, NULL
      );
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.price IS DISTINCT FROM NEW.price THEN
    PERFORM yike_insert_listing_history_event(
      NEW.id, 'price_changed',
      jsonb_build_object('price', OLD.price),
      jsonb_build_object('price', NEW.price),
      NULL, NULL, 'db_trigger', false, NULL
    );
  END IF;

  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM yike_insert_listing_history_event(
      NEW.id, 'status_changed',
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status),
      NULL, NULL, 'db_trigger', false, NULL
    );
    IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' THEN
      PERFORM yike_insert_listing_history_event(
        NEW.id, 'listing_published',
        jsonb_build_object('status', OLD.status),
        jsonb_build_object('status', NEW.status),
        NULL, NULL, 'db_trigger', false, NULL
      );
    END IF;
    IF NEW.status = 'rented' THEN
      PERFORM yike_insert_listing_history_event(
        NEW.id, 'marked_rented',
        jsonb_build_object('status', OLD.status),
        jsonb_build_object('status', NEW.status),
        NULL, NULL, 'db_trigger', false, NULL
      );
    END IF;
  END IF;

  IF OLD.availability_status IS DISTINCT FROM NEW.availability_status THEN
    IF NEW.availability_status = 'sold' THEN
      PERFORM yike_insert_listing_history_event(
        NEW.id, 'marked_sold',
        jsonb_build_object('availability_status', OLD.availability_status),
        jsonb_build_object('availability_status', NEW.availability_status),
        NULL, NULL, 'db_trigger', false, NULL
      );
    ELSIF NEW.availability_status IN ('unavailable', 'rented', 'sold') THEN
      PERFORM yike_insert_listing_history_event(
        NEW.id, 'marked_unavailable',
        jsonb_build_object('availability_status', OLD.availability_status),
        jsonb_build_object('availability_status', NEW.availability_status),
        NULL, NULL, 'db_trigger', false, NULL
      );
    END IF;
  END IF;

  IF OLD.reactivated_at IS DISTINCT FROM NEW.reactivated_at AND NEW.reactivated_at IS NOT NULL THEN
    PERFORM yike_insert_listing_history_event(
      NEW.id, 'reactivated', NULL,
      jsonb_build_object('reactivated_at', NEW.reactivated_at),
      NEW.last_reactivated_by, 'agent', 'db_trigger', true, NULL
    );
  END IF;

  IF OLD.expired_at IS NULL AND NEW.expired_at IS NOT NULL THEN
    PERFORM yike_insert_listing_history_event(
      NEW.id, 'expired', NULL,
      jsonb_build_object('expired_at', NEW.expired_at),
      NULL, NULL, 'db_trigger', false, NULL
    );
  END IF;

  IF OLD.agent_id IS DISTINCT FROM NEW.agent_id THEN
    PERFORM yike_insert_listing_history_event(
      NEW.id, 'agent_changed',
      jsonb_build_object('agent_id', OLD.agent_id),
      jsonb_build_object('agent_id', NEW.agent_id),
      NULL, NULL, 'db_trigger', false, NULL
    );
  END IF;

  IF OLD.media_urls IS DISTINCT FROM NEW.media_urls THEN
    PERFORM yike_insert_listing_history_event(
      NEW.id, 'photos_updated',
      jsonb_build_object('count', COALESCE(array_length(OLD.media_urls, 1), 0)),
      jsonb_build_object('count', COALESCE(array_length(NEW.media_urls, 1), 0)),
      NULL, NULL, 'db_trigger', false, NULL
    );
  END IF;

  IF OLD.description IS DISTINCT FROM NEW.description
     AND COALESCE(length(trim(OLD.description)), 0) <> COALESCE(length(trim(NEW.description)), 0) THEN
    PERFORM yike_insert_listing_history_event(
      NEW.id, 'description_updated', NULL,
      jsonb_build_object('length', COALESCE(length(trim(NEW.description)), 0)),
      NULL, NULL, 'db_trigger', false, NULL
    );
  END IF;

  IF (OLD.yike_verified IS DISTINCT FROM NEW.yike_verified) AND NEW.yike_verified = true THEN
    PERFORM yike_insert_listing_history_event(
      NEW.id, 'verified_physical', NULL,
      jsonb_build_object('yike_verified', true, 'level', NEW.yike_verification_level),
      NEW.yike_verified_by, 'admin', 'db_trigger', true, NULL
    );
  END IF;

  IF (OLD.is_boosted IS DISTINCT FROM NEW.is_boosted) AND NEW.is_boosted = true THEN
    PERFORM yike_insert_listing_history_event(
      NEW.id, 'listing_boosted', NULL,
      jsonb_build_object('boosted_until', NEW.boosted_until),
      NEW.boosted_by, 'admin', 'db_trigger', false, NULL
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS yike_properties_history_trg ON properties;
CREATE TRIGGER yike_properties_history_trg
  AFTER INSERT OR UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION yike_properties_history_trigger();

ALTER TABLE listing_history_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS listing_history_staff ON listing_history_events;
CREATE POLICY listing_history_staff ON listing_history_events
  FOR ALL USING (is_staff_admin());
