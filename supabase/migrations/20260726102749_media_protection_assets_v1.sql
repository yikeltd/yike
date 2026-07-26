-- Media Protection Pipeline: media_assets registry + private original archive bucket
-- Project: hlpojfurfldvcxfxhveg

-- ---------------------------------------------------------------------------
-- Private archive for unprotected originals (staff / service_role only)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-media-archive',
  'listing-media-archive',
  FALSE,
  15728640,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/octet-stream']
)
ON CONFLICT (id) DO UPDATE SET
  public = FALSE,
  file_size_limit = GREATEST(storage.buckets.file_size_limit, EXCLUDED.file_size_limit),
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "listing_media_archive_staff_select" ON storage.objects;
CREATE POLICY "listing_media_archive_staff_select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'listing-media-archive' AND public.is_staff_admin());

DROP POLICY IF EXISTS "listing_media_archive_staff_all" ON storage.objects;
CREATE POLICY "listing_media_archive_staff_all"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'listing-media-archive' AND public.is_staff_admin())
  WITH CHECK (bucket_id = 'listing-media-archive' AND public.is_staff_admin());

-- ---------------------------------------------------------------------------
-- media_assets — source of truth for fingerprints + protection metadata
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  listing_ref TEXT NOT NULL,
  marketplace TEXT NOT NULL DEFAULT 'yike',
  asset_type TEXT NOT NULL DEFAULT 'property'
    CHECK (asset_type IN ('property', 'vehicle', 'other')),
  seller_name TEXT,
  company_name TEXT,
  watermark_label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sha256 TEXT NOT NULL,
  phash TEXT NOT NULL,
  dhash TEXT NOT NULL,
  ahash TEXT NOT NULL,
  original_width INTEGER,
  original_height INTEGER,
  processed_width INTEGER,
  processed_height INTEGER,
  watermark_version TEXT NOT NULL,
  pipeline_version TEXT NOT NULL,
  media_version TEXT NOT NULL DEFAULT '1',
  storage_bucket_public TEXT NOT NULL DEFAULT 'property-media',
  storage_bucket_archive TEXT NOT NULL DEFAULT 'listing-media-archive',
  path_thumbnail TEXT,
  path_medium TEXT,
  path_large TEXT,
  path_original TEXT,
  index_in_listing INTEGER,
  mime_source TEXT,
  bytes_original INTEGER,
  bytes_large INTEGER,
  protection_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS media_assets_owner_idx ON public.media_assets (owner_id);
CREATE INDEX IF NOT EXISTS media_assets_listing_idx ON public.media_assets (listing_id);
CREATE INDEX IF NOT EXISTS media_assets_listing_ref_idx ON public.media_assets (listing_ref);
CREATE INDEX IF NOT EXISTS media_assets_sha256_idx ON public.media_assets (sha256);
CREATE INDEX IF NOT EXISTS media_assets_phash_idx ON public.media_assets (phash);
CREATE INDEX IF NOT EXISTS media_assets_created_idx ON public.media_assets (created_at DESC);

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "media_assets_owner_select" ON public.media_assets;
CREATE POLICY "media_assets_owner_select"
  ON public.media_assets
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid() OR public.is_staff_admin());

DROP POLICY IF EXISTS "media_assets_staff_all" ON public.media_assets;
CREATE POLICY "media_assets_staff_all"
  ON public.media_assets
  FOR ALL
  TO authenticated
  USING (public.is_staff_admin())
  WITH CHECK (public.is_staff_admin());

COMMENT ON TABLE public.media_assets IS
  'Enterprise media protection registry: fingerprints, watermark versions, private archive paths.';

NOTIFY pgrst, 'reload schema';
