-- Private CAC document path on profiles (not publicly exposed)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cac_document_path TEXT;

-- Allow PDF uploads in agent-documents bucket for CAC certificates
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf'
]
WHERE id = 'agent-documents';

-- Agents upload their own CAC docs during profile setup
DROP POLICY IF EXISTS "Agents upload own documents" ON storage.objects;
CREATE POLICY "Agents upload own documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'agent-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Agents read own documents" ON storage.objects;
CREATE POLICY "Agents read own documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'agent-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
