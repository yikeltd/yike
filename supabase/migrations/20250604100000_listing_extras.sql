-- Nigerian market differentiation: rent transparency + amenities

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS extras JSONB NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS properties_extras_amenities_idx
  ON properties USING GIN ((extras -> 'amenities'));

-- Align property_type with expanded Nigerian taxonomy
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_property_type_check;
ALTER TABLE properties ADD CONSTRAINT properties_property_type_check
  CHECK (property_type IS NULL OR property_type IN (
    'self_contain', 'room', 'mini_flat', 'flat', 'flat_2', 'flat_3',
    'duplex', 'terrace_duplex', 'detached_duplex', 'bungalow', 'mansion',
    'shop', 'office', 'plaza', 'warehouse', 'event_center',
    'land', 'land_residential', 'land_commercial', 'land_farm',
    'shortlet_apt', 'airbnb', 'hotel_apt', 'guest_house',
    'hostel', 'student_lodge', 'shared_apt'
  ));

-- Weekly payment period (shortlets)
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_payment_period_check;
ALTER TABLE properties ADD CONSTRAINT properties_payment_period_check
  CHECK (payment_period IN ('yearly', 'monthly', 'weekly', 'daily', 'total'));
