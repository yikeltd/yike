-- Admin command center: staff roles, profiles, audit logs, admin PIN

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    'user',
    'agent_unverified',
    'agent_verified',
    'admin',
    'super_admin',
    'support',
    'tech',
    'content',
    'careers',
    'moderator'
  ));

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS admin_pin_hash TEXT,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS staff_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN (
    'super_admin', 'admin', 'support', 'tech', 'content', 'careers', 'moderator'
  )),
  department TEXT,
  responsibilities TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  disabled_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS staff_profiles_role_idx ON staff_profiles (role, status);
CREATE INDEX IF NOT EXISTS staff_profiles_email_idx ON staff_profiles (email);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON audit_logs (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON audit_logs (action, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs (created_at DESC);

CREATE TABLE IF NOT EXISTS admin_pin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_pin_sessions_user_idx ON admin_pin_sessions (user_id, expires_at DESC);

ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_pin_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_profiles_admin_select ON staff_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY staff_profiles_admin_write ON staff_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY audit_logs_admin_select ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin', 'tech')
    )
  );

CREATE POLICY audit_logs_admin_insert ON audit_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin', 'support', 'tech', 'content', 'careers', 'moderator')
    )
  );

CREATE POLICY admin_pin_sessions_own ON admin_pin_sessions
  FOR ALL USING (user_id = auth.uid());

-- Extend admin RLS helpers for new staff roles on existing tables
CREATE OR REPLACE FUNCTION is_staff_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'support', 'tech', 'content', 'careers', 'moderator')
      AND is_banned = FALSE
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
