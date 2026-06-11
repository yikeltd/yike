-- Production catch-up: agent-documents bucket was missing despite migration history.
-- Safe to re-run.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agent-documents',
  'agent-documents',
  FALSE,
  15728640,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Staff manage agent documents" ON storage.objects;
CREATE POLICY "Staff manage agent documents"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'agent-documents' AND is_staff_admin())
  WITH CHECK (bucket_id = 'agent-documents' AND is_staff_admin());

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
