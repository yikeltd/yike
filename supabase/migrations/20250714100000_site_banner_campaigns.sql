-- Admin promo campaigns: type + optional audience targeting metadata

ALTER TABLE site_banners
  ADD COLUMN IF NOT EXISTS campaign_type TEXT NOT NULL DEFAULT 'general_promo',
  ADD COLUMN IF NOT EXISTS audience_targeting JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS site_banners_campaign_type_idx
  ON site_banners (campaign_type, is_active, placement);
