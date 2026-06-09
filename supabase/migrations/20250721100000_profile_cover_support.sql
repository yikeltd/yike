-- Premium profile cover images (users, agents, companies).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cover_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_position_y SMALLINT NOT NULL DEFAULT 50;

COMMENT ON COLUMN public.profiles.cover_url IS 'Public cover/banner WebP URL (profile-images bucket).';
COMMENT ON COLUMN public.profiles.cover_position_y IS 'Vertical focal point 0–100 for cover crop/display.';

-- Backfill from legacy company cover field.
UPDATE public.profiles
SET cover_url = company_cover_url
WHERE cover_url IS NULL
  AND company_cover_url IS NOT NULL
  AND TRIM(company_cover_url) <> '';

-- Keep company_cover_url in sync when cover is set (display compat).
CREATE OR REPLACE FUNCTION public.sync_company_cover_from_cover_url()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.cover_url IS DISTINCT FROM OLD.cover_url THEN
    NEW.company_cover_url := NEW.cover_url;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_sync_company_cover ON public.profiles;
CREATE TRIGGER profiles_sync_company_cover
  BEFORE UPDATE OF cover_url ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_company_cover_from_cover_url();

-- Cover outputs can be up to ~5MB; keep bucket at 6MB.
UPDATE storage.buckets
SET file_size_limit = 6291456
WHERE id = 'profile-images';
