-- Structured listing photos: room labels, sort order, WebP variants.
-- media_urls remains the canonical URL array for backward compatibility.

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS media_items JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN properties.media_items IS
  'Ordered photo metadata: image_url, webp_url, room_label, sort_order, is_cover, etc.';
