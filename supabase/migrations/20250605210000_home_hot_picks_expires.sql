-- Optional expiry for admin hot picks

ALTER TABLE home_hot_picks
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
