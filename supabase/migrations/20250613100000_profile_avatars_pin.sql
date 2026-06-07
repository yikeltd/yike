-- Profile avatars in property-media + PIN login lookup (server token)

DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
CREATE POLICY "Users upload own avatar"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'property-media'
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
CREATE POLICY "Users update own avatar"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'property-media'
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE OR REPLACE FUNCTION yike_pin_login_lookup(p_token text, p_identifier text)
RETURNS TABLE(
  user_id uuid,
  email text,
  pin_hash text,
  full_name text,
  username text,
  avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  PERFORM yike_assert_otp_token(p_token);

  RETURN QUERY
  SELECT
    p.id,
    u.email::text,
    p.pin_hash,
    p.full_name,
    p.username,
    p.avatar_url
  FROM profiles p
  INNER JOIN auth.users u ON u.id = p.id
  WHERE p.is_banned = false
    AND p.pin_hash IS NOT NULL
    AND p.deleted_at IS NULL
    AND (
      LOWER(TRIM(p.username)) = LOWER(TRIM(p_identifier))
      OR LOWER(u.email) = LOWER(TRIM(p_identifier))
    )
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION yike_pin_login_lookup(text, text) TO anon, authenticated, service_role;
