-- Vehicle detail promotion slot (ads only render when placement is active).
INSERT INTO ad_placements (placement_key, label) VALUES
  ('vehicle_detail', 'Vehicle detail — before similar vehicles')
ON CONFLICT (placement_key) DO NOTHING;

-- Clarify property detail label for admin ads console.
UPDATE ad_placements
SET label = 'Property detail — before related homes'
WHERE placement_key = 'property_detail'
  AND label IS DISTINCT FROM 'Property detail — before related homes';
