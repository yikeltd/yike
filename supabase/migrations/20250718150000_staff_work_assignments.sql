-- Staff work assignments for role-based APK routing

CREATE TABLE IF NOT EXISTS staff_work_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  work_area TEXT NOT NULL CHECK (work_area IN (
    'command_center',
    'support',
    'listing_review',
    'trust_review',
    'verification',
    'ambassadors',
    'legal_partners',
    'deal_matching',
    'tech'
  )),
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  priority INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (staff_id, work_area)
);

CREATE INDEX IF NOT EXISTS staff_work_assignments_staff_idx
  ON staff_work_assignments (staff_id, is_active, priority DESC);

ALTER TABLE staff_work_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_work_assignments_admin_select ON staff_work_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY staff_work_assignments_admin_write ON staff_work_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY staff_work_assignments_self_read ON staff_work_assignments
  FOR SELECT USING (staff_id = auth.uid());

DROP TRIGGER IF EXISTS staff_work_assignments_updated_at ON staff_work_assignments;
CREATE TRIGGER staff_work_assignments_updated_at
  BEFORE UPDATE ON staff_work_assignments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
