-- Admin-managed site banners (mobile header, etc.)

CREATE TABLE site_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  message TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  link_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  priority INT NOT NULL DEFAULT 0,
  placement TEXT NOT NULL DEFAULT 'mobile_header',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX site_banners_active_placement_idx
  ON site_banners (placement, is_active, priority DESC, created_at DESC);

CREATE TRIGGER site_banners_updated_at
  BEFORE UPDATE ON site_banners
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE site_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read live site banners"
  ON site_banners FOR SELECT
  USING (
    (
      is_active = TRUE
      AND (starts_at IS NULL OR starts_at <= NOW())
      AND (ends_at IS NULL OR ends_at > NOW())
      AND (
        TRIM(COALESCE(message, '')) <> ''
        OR TRIM(COALESCE(title, '')) <> ''
        OR (image_url IS NOT NULL AND TRIM(image_url) <> '')
      )
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
        AND is_banned = FALSE
    )
  );

CREATE POLICY "Admins manage site banners"
  ON site_banners FOR ALL
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
