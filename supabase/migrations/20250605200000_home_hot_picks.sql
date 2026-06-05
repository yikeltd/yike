-- Admin-managed hot picks carousel on the home page

CREATE TABLE home_hot_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  title TEXT,
  badge TEXT NOT NULL DEFAULT 'Hot pick',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (property_id)
);

CREATE INDEX home_hot_picks_active_order_idx
  ON home_hot_picks (is_active, sort_order ASC);

CREATE TRIGGER home_hot_picks_updated_at
  BEFORE UPDATE ON home_hot_picks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE home_hot_picks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active hot picks"
  ON home_hot_picks FOR SELECT
  USING (
    is_active = TRUE
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
        AND is_banned = FALSE
    )
  );

CREATE POLICY "Admins manage hot picks"
  ON home_hot_picks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin') AND is_banned = FALSE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin') AND is_banned = FALSE
    )
  );
