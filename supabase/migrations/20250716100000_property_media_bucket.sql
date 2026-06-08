-- property-media bucket (listing photos + avatars) — required by POST /api/media/upload

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-media',
  'property-media',
  TRUE,
  15728640,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read for approved listing images & avatars
DROP POLICY IF EXISTS "Property media public read" ON storage.objects;
CREATE POLICY "Property media public read"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'property-media');

-- Authenticated agents upload listing photos under properties/*
DROP POLICY IF EXISTS "Agents upload listing photos" ON storage.objects;
CREATE POLICY "Agents upload listing photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'property-media'
    AND (storage.foldername(name))[1] = 'properties'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.is_banned = false
        AND p.role IN ('agent_unverified', 'agent_verified', 'admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Agents update listing photos" ON storage.objects;
CREATE POLICY "Agents update listing photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'property-media'
    AND (storage.foldername(name))[1] = 'properties'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.is_banned = false
        AND p.role IN ('agent_unverified', 'agent_verified', 'admin', 'super_admin')
    )
  );

-- Staff / admin manage all property-media objects
DROP POLICY IF EXISTS "Staff manage property media" ON storage.objects;
CREATE POLICY "Staff manage property media"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'property-media' AND is_staff_admin())
  WITH CHECK (bucket_id = 'property-media' AND is_staff_admin());
