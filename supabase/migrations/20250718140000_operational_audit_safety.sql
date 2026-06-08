-- Operational audit logging extensions, safe support view, soft-delete columns

-- ── Audit log enrichment ──────────────────────────────────────────────────────

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS actor_name TEXT,
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS target_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS target_user_name TEXT,
  ADD COLUMN IF NOT EXISTS reason TEXT,
  ADD COLUMN IF NOT EXISTS route TEXT,
  ADD COLUMN IF NOT EXISTS user_agent_hash TEXT,
  ADD COLUMN IF NOT EXISTS risk_level TEXT NOT NULL DEFAULT 'low'
    CHECK (risk_level IN ('low', 'medium', 'high', 'critical'));

CREATE INDEX IF NOT EXISTS audit_logs_summary_idx
  ON audit_logs (created_at DESC)
  WHERE summary IS NOT NULL;

CREATE INDEX IF NOT EXISTS audit_logs_target_user_idx
  ON audit_logs (target_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_risk_idx
  ON audit_logs (risk_level, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_reason_idx
  ON audit_logs (created_at DESC)
  WHERE reason IS NOT NULL;

-- ── Safe support view permissions ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS account_view_permissions (
  profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  can_view_accounts BOOLEAN NOT NULL DEFAULT FALSE,
  granted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

ALTER TABLE account_view_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY account_view_permissions_admin_select ON account_view_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
        AND p.is_banned = FALSE
    )
  );

CREATE POLICY account_view_permissions_admin_write ON account_view_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
        AND p.is_banned = FALSE
    )
  );

CREATE TABLE IF NOT EXISTS support_view_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  read_only BOOLEAN NOT NULL DEFAULT TRUE,
  route TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  end_reason TEXT
);

CREATE INDEX IF NOT EXISTS support_view_sessions_admin_idx
  ON support_view_sessions (admin_id, started_at DESC);

CREATE INDEX IF NOT EXISTS support_view_sessions_target_idx
  ON support_view_sessions (target_user_id, started_at DESC);

ALTER TABLE support_view_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY support_view_sessions_admin ON support_view_sessions
  FOR ALL USING (
    admin_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
        AND p.is_banned = FALSE
    )
  );

-- ── Soft-delete / archive columns ─────────────────────────────────────────────

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archive_reason TEXT;

CREATE INDEX IF NOT EXISTS properties_archived_idx
  ON properties (archived_at DESC)
  WHERE archived_at IS NOT NULL;

ALTER TABLE site_banners
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE home_hot_picks
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE ad_placements
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
