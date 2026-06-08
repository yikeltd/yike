-- Public bucket for admin-uploaded ad creatives (email chips, website ads)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ad-creatives',
  'ad-creatives',
  TRUE,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read ad creatives" ON storage.objects;
CREATE POLICY "Public read ad creatives"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'ad-creatives');

-- Staff uploads via console; service role API also bypasses RLS for /api/admin/ads/upload-image
DROP POLICY IF EXISTS "Staff upload ad creatives" ON storage.objects;
CREATE POLICY "Staff upload ad creatives"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ad-creatives' AND is_staff_admin());

DROP POLICY IF EXISTS "Staff update ad creatives" ON storage.objects;
CREATE POLICY "Staff update ad creatives"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'ad-creatives' AND is_staff_admin())
  WITH CHECK (bucket_id = 'ad-creatives' AND is_staff_admin());

DROP POLICY IF EXISTS "Staff delete ad creatives" ON storage.objects;
CREATE POLICY "Staff delete ad creatives"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'ad-creatives' AND is_staff_admin());
