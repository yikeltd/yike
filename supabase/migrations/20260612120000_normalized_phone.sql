-- Normalized phone for duplicate detection at signup and profile updates.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS normalized_phone TEXT;

CREATE OR REPLACE FUNCTION public.yike_normalize_phone_digits(p_raw text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_raw IS NULL OR TRIM(p_raw) = '' THEN NULL
    WHEN regexp_replace(p_raw, '\D', '', 'g') ~ '^234\d{10}$'
      THEN regexp_replace(p_raw, '\D', '', 'g')
    WHEN regexp_replace(p_raw, '\D', '', 'g') ~ '^0\d{10}$'
      THEN '234' || substr(regexp_replace(p_raw, '\D', '', 'g'), 2)
    WHEN regexp_replace(p_raw, '\D', '', 'g') ~ '^\d{10}$'
      THEN '234' || regexp_replace(p_raw, '\D', '', 'g')
    ELSE NULL
  END;
$$;

UPDATE public.profiles
SET normalized_phone = public.yike_normalize_phone_digits(COALESCE(phone, whatsapp))
WHERE normalized_phone IS NULL
  AND COALESCE(phone, whatsapp) IS NOT NULL;

-- Keep one profile per normalized phone (prefer verified, then earliest).
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY normalized_phone
      ORDER BY phone_verified DESC, created_at ASC NULLS LAST, id ASC
    ) AS rn
  FROM public.profiles
  WHERE normalized_phone IS NOT NULL
)
UPDATE public.profiles p
SET normalized_phone = NULL
FROM ranked r
WHERE p.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_normalized_phone_unique
  ON public.profiles (normalized_phone)
  WHERE normalized_phone IS NOT NULL;

CREATE OR REPLACE FUNCTION public.yike_check_signup_duplicates(
  p_token text,
  p_email text DEFAULT NULL,
  p_phone text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email_exists boolean := false;
  v_phone_exists boolean := false;
  v_norm text;
BEGIN
  PERFORM yike_assert_otp_token(p_token);

  IF p_email IS NOT NULL AND TRIM(p_email) <> '' THEN
    SELECT EXISTS (
      SELECT 1
      FROM auth.users
      WHERE LOWER(email) = LOWER(TRIM(p_email))
    )
    OR EXISTS (
      SELECT 1
      FROM auth_signup_pending
      WHERE LOWER(email) = LOWER(TRIM(p_email))
        AND expires_at > NOW()
    )
    INTO v_email_exists;
  END IF;

  v_norm := public.yike_normalize_phone_digits(p_phone);
  IF v_norm IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM profiles
      WHERE normalized_phone = v_norm
    )
    OR EXISTS (
      SELECT 1
      FROM auth_signup_pending
      WHERE public.yike_normalize_phone_digits(phone) = v_norm
        AND expires_at > NOW()
    )
    INTO v_phone_exists;
  END IF;

  RETURN jsonb_build_object(
    'emailExists', v_email_exists,
    'phoneExists', v_phone_exists
  );
END;
$$;

CREATE OR REPLACE FUNCTION yike_complete_signup(
  p_token text,
  p_user_id uuid,
  p_username text,
  p_pin_hash text,
  p_phone text,
  p_full_name text,
  p_phone_verified boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone text := NULLIF(TRIM(p_phone), '');
  v_norm text;
BEGIN
  PERFORM yike_assert_otp_token(p_token);

  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE LOWER(username) = LOWER(NULLIF(TRIM(p_username), ''))
      AND id <> p_user_id
  ) THEN
    RAISE EXCEPTION 'username_taken';
  END IF;

  v_norm := public.yike_normalize_phone_digits(v_phone);

  IF v_norm IS NOT NULL AND EXISTS (
    SELECT 1 FROM profiles
    WHERE normalized_phone = v_norm AND id <> p_user_id
  ) THEN
    RAISE EXCEPTION 'phone_exists';
  END IF;

  UPDATE profiles
  SET
    full_name = NULLIF(TRIM(p_full_name), ''),
    username = NULLIF(TRIM(p_username), ''),
    phone = v_phone,
    normalized_phone = v_norm,
    pin_hash = p_pin_hash,
    phone_verified = COALESCE(p_phone_verified, false),
    email_verified = FALSE,
    role = 'user',
    verification_status = 'not_started',
    is_banned = FALSE
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO profiles (
      id, full_name, username, phone, normalized_phone, pin_hash,
      phone_verified, email_verified, role, verification_status, is_banned
    ) VALUES (
      p_user_id,
      NULLIF(TRIM(p_full_name), ''),
      NULLIF(TRIM(p_username), ''),
      v_phone,
      v_norm,
      p_pin_hash,
      COALESCE(p_phone_verified, false),
      FALSE,
      'user',
      'not_started',
      FALSE
    );
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.yike_check_signup_duplicates(text, text, text) TO anon, authenticated, service_role;
