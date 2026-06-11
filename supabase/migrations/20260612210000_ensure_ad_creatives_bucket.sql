-- Repair ad-creatives bucket (email sponsor chips, website ad creatives).
-- Idempotent — safe if 20250718130000 was never applied on production.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ad-creatives',
  'ad-creatives',
  TRUE,
  10485760,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = GREATEST(storage.buckets.file_size_limit, EXCLUDED.file_size_limit),
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read ad creatives" ON storage.objects;
CREATE POLICY "Public read ad creatives"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'ad-creatives');

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

-- HEIC on profile-images for mobile uploads
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
]
WHERE id = 'profile-images';

NOTIFY pgrst, 'reload schema';
