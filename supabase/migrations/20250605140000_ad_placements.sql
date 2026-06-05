-- Sponsored ad placements — admin fills creative; public sees active slots only

CREATE TABLE ad_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  title TEXT,
  image_url TEXT,
  link_url TEXT,
  alt_text TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER ad_placements_updated_at
  BEFORE UPDATE ON ad_placements
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE ad_placements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active ad placements"
  ON ad_placements FOR SELECT
  USING (
    is_active = TRUE
    AND image_url IS NOT NULL
    AND TRIM(image_url) <> ''
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (ends_at IS NULL OR ends_at > NOW())
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
        AND is_banned = FALSE
    )
  );

CREATE POLICY "Admins insert ad placements"
  ON ad_placements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin') AND is_banned = FALSE
    )
  );

CREATE POLICY "Admins update ad placements"
  ON ad_placements FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin') AND is_banned = FALSE
    )
  );

INSERT INTO ad_placements (placement_key, label) VALUES
  ('home_feed_mid', 'Home feed — mid scroll (mobile)'),
  ('home_discover', 'Home — after Explore Nigeria'),
  ('search_top', 'Search — above results'),
  ('search_feed_mid', 'Search — mid results grid'),
  ('location_top', 'City / area pages — above listings'),
  ('property_detail', 'Listing detail — before related homes'),
  ('footer_strip', 'Footer — sponsor strip');
