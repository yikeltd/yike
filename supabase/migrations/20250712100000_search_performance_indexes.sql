-- Search and feed performance indexes for approved listings
CREATE INDEX IF NOT EXISTS properties_approved_type_idx
  ON properties (property_type, created_at DESC)
  WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS properties_approved_listing_type_idx
  ON properties (listing_type, created_at DESC)
  WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS properties_approved_city_created_idx
  ON properties (city, created_at DESC)
  WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS properties_approved_expires_idx
  ON properties (expires_at, created_at DESC)
  WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS favorites_user_created_idx
  ON favorites (user_id, created_at DESC);
