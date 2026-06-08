-- Dedicated profile image bucket. Listing photos remain in property-media.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Profile images public read" ON storage.objects;
CREATE POLICY "Profile images public read"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "Users upload own profile image" ON storage.objects;
CREATE POLICY "Users upload own profile image"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND RIGHT(LOWER(name), 5) = '.webp'
  );

DROP POLICY IF EXISTS "Users update own profile image" ON storage.objects;
CREATE POLICY "Users update own profile image"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND RIGHT(LOWER(name), 5) = '.webp'
  );

DROP POLICY IF EXISTS "Users delete own profile image" ON storage.objects;
CREATE POLICY "Users delete own profile image"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
