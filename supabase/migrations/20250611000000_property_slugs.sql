-- SEO slugs + admin listing metadata
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS slug_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text;

CREATE UNIQUE INDEX IF NOT EXISTS properties_slug_unique ON properties (slug)
  WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS properties_slug_lookup ON properties (slug);

-- Slugify helper for backfill
CREATE OR REPLACE FUNCTION public.slugify_property_text(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT trim(both '-' from regexp_replace(
    lower(regexp_replace(coalesce(input, ''), '[^a-zA-Z0-9]+', '-', 'g')),
    '-+', '-', 'g'
  ));
$$;

-- Backfill slugs for existing rows (safe, handles duplicates)
DO $$
DECLARE
  r RECORD;
  base_slug text;
  candidate text;
  n int;
BEGIN
  FOR r IN
    SELECT id, bedrooms, property_type, listing_type, area, city
    FROM properties
    WHERE slug IS NULL
    ORDER BY created_at
  LOOP
    base_slug := public.slugify_property_text(
      trim(both '-' from concat_ws('-',
        CASE WHEN r.bedrooms > 0 THEN r.bedrooms::text || '-bedroom' ELSE NULL END,
        NULLIF(r.property_type, ''),
        CASE r.listing_type
          WHEN 'rent' THEN 'for-rent'
          WHEN 'sale' THEN 'for-sale'
          WHEN 'lease' THEN 'for-lease'
          WHEN 'shortlet' THEN 'shortlet'
          ELSE NULL
        END,
        NULLIF(r.area, ''),
        NULLIF(r.city, '')
      ))
    );

    IF base_slug = '' OR base_slug IS NULL THEN
      base_slug := 'property';
    END IF;

    IF length(base_slug) > 80 THEN
      base_slug := left(base_slug, 80);
      base_slug := trim(both '-' from base_slug);
    END IF;

    candidate := base_slug;
    n := 2;

    WHILE EXISTS (SELECT 1 FROM properties p WHERE p.slug = candidate AND p.id <> r.id) LOOP
      candidate := base_slug || '-' || n::text;
      n := n + 1;
      IF n > 50 THEN
        candidate := base_slug || '-yk' || substr(replace(r.id::text, '-', ''), 1, 4);
        EXIT;
      END IF;
    END LOOP;

    UPDATE properties SET slug = candidate, updated_at = now() WHERE id = r.id;
  END LOOP;
END $$;

-- Auto-generate slug on insert when missing (unless slug_locked)
CREATE OR REPLACE FUNCTION public.properties_set_slug_on_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  candidate text;
  n int;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
    RETURN NEW;
  END IF;

  base_slug := public.slugify_property_text(
    trim(both '-' from concat_ws('-',
      CASE WHEN NEW.bedrooms > 0 THEN NEW.bedrooms::text || '-bedroom' ELSE NULL END,
      NULLIF(NEW.property_type, ''),
      CASE NEW.listing_type
        WHEN 'rent' THEN 'for-rent'
        WHEN 'sale' THEN 'for-sale'
        WHEN 'lease' THEN 'for-lease'
        WHEN 'shortlet' THEN 'shortlet'
        ELSE NULL
      END,
      NULLIF(NEW.area, ''),
      NULLIF(NEW.city, '')
    ))
  );

  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'property';
  END IF;

  IF length(base_slug) > 80 THEN
    base_slug := left(base_slug, 80);
    base_slug := trim(both '-' from base_slug);
  END IF;

  candidate := base_slug;
  n := 2;

  WHILE EXISTS (SELECT 1 FROM properties p WHERE p.slug = candidate AND p.id IS DISTINCT FROM NEW.id) LOOP
    candidate := base_slug || '-' || n::text;
    n := n + 1;
    IF n > 50 THEN
      candidate := base_slug || '-yk' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 4);
      EXIT;
    END IF;
  END LOOP;

  NEW.slug := candidate;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS properties_slug_before_insert ON properties;
CREATE TRIGGER properties_slug_before_insert
  BEFORE INSERT ON properties
  FOR EACH ROW
  WHEN (NEW.slug IS NULL OR NEW.slug = '')
  EXECUTE FUNCTION public.properties_set_slug_on_insert();
