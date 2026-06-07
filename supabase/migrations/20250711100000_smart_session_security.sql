-- Smart login, PIN unlock, trusted devices, and auth security events

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_unlocked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS session_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS session_locked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pin_failed_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pin_locked_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS has_pin_set BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE profiles
SET has_pin_set = TRUE
WHERE pin_hash IS NOT NULL AND pin_hash <> '' AND has_pin_set = FALSE;

CREATE TABLE IF NOT EXISTS trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_token_hash TEXT NOT NULL,
  user_agent_hint TEXT,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trusted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  UNIQUE (user_id, device_token_hash)
);

CREATE INDEX IF NOT EXISTS trusted_devices_user_idx
  ON trusted_devices (user_id, last_seen_at DESC);

CREATE TABLE IF NOT EXISTS auth_security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_hash TEXT,
  user_agent_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS auth_security_events_user_idx
  ON auth_security_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS auth_security_events_type_idx
  ON auth_security_events (event_type, created_at DESC);

CREATE TABLE IF NOT EXISTS auth_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier_hash TEXT NOT NULL,
  attempt_type TEXT NOT NULL CHECK (attempt_type IN ('password', 'pin')),
  success BOOLEAN NOT NULL DEFAULT FALSE,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS auth_login_attempts_identifier_idx
  ON auth_login_attempts (identifier_hash, created_at DESC);

ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_login_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS trusted_devices_staff ON trusted_devices;
CREATE POLICY trusted_devices_staff ON trusted_devices FOR ALL USING (is_staff_admin());

DROP POLICY IF EXISTS auth_security_events_staff ON auth_security_events;
CREATE POLICY auth_security_events_staff ON auth_security_events FOR ALL USING (is_staff_admin());

DROP POLICY IF EXISTS auth_login_attempts_staff ON auth_login_attempts;
CREATE POLICY auth_login_attempts_staff ON auth_login_attempts FOR ALL USING (is_staff_admin());
