-- Case-insensitive email uniqueness on profiles (signup duplicate safety).

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(TRIM(email))
      ORDER BY email_verified DESC, created_at ASC NULLS LAST, id ASC
    ) AS rn
  FROM public.profiles
  WHERE email IS NOT NULL AND TRIM(email) <> ''
)
UPDATE public.profiles p
SET email = NULL
FROM ranked r
WHERE p.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_lower_unique
  ON public.profiles (LOWER(email))
  WHERE email IS NOT NULL AND TRIM(email) <> '';
