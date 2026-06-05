-- Admin-curated hottest listing slots on the home page

ALTER TABLE ad_placements
  ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id) ON DELETE SET NULL;

INSERT INTO ad_placements (placement_key, label) VALUES
  ('home_hotspot_1', 'Home — Hottest pick slot 1'),
  ('home_hotspot_2', 'Home — Hottest pick slot 2')
ON CONFLICT (placement_key) DO NOTHING;
