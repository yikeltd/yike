-- agent-documents bucket (verification selfies, KYC uploads) — required by POST /api/agent/verification/selfie

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agent-documents',
  'agent-documents',
  FALSE,
  15728640,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Staff manage agent verification documents
DROP POLICY IF EXISTS "Staff manage agent documents" ON storage.objects;
CREATE POLICY "Staff manage agent documents"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'agent-documents' AND is_staff_admin())
  WITH CHECK (bucket_id = 'agent-documents' AND is_staff_admin());
