-- Auth security hardening: per-device PIN lockout + trusted device binding

ALTER TABLE trusted_devices
  ADD COLUMN IF NOT EXISTS user_agent_hash TEXT,
  ADD COLUMN IF NOT EXISTS ip_subnet_hash TEXT;

CREATE TABLE IF NOT EXISTS pin_device_lockouts (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_key_hash TEXT NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, device_key_hash)
);

CREATE INDEX IF NOT EXISTS pin_device_lockouts_locked_idx
  ON pin_device_lockouts (user_id, locked_until DESC)
  WHERE locked_until IS NOT NULL;

ALTER TABLE pin_device_lockouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pin_device_lockouts_staff ON pin_device_lockouts;
CREATE POLICY pin_device_lockouts_staff ON pin_device_lockouts FOR ALL USING (is_staff_admin());
