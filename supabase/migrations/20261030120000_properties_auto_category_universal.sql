-- Legacy properties_auto_category_check only allowed early vehicle ids; blocks
-- electronics and expanded vehicle taxonomy. Category ids are validated at create APIs.

ALTER TABLE public.properties
  DROP CONSTRAINT IF EXISTS properties_auto_category_check;

-- Align trigger mapping with properties_condition_check (vehicle_condition "used" → canonical).
CREATE OR REPLACE FUNCTION public.sync_listing_condition()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.condition IS NULL AND NEW.vehicle_condition IS NOT NULL)
     OR (TG_OP = 'UPDATE' AND NEW.vehicle_condition IS DISTINCT FROM OLD.vehicle_condition) THEN
    NEW.condition := CASE
      WHEN NEW.vehicle_condition = 'new' THEN 'brand_new'
      WHEN NEW.vehicle_condition = 'certified' THEN 'refurbished'
      WHEN NEW.vehicle_condition = 'used' THEN 'nigerian_used'
      ELSE NEW.vehicle_condition
    END;
  ELSIF (TG_OP = 'INSERT' AND NEW.vehicle_condition IS NULL AND NEW.condition IS NOT NULL AND NEW.asset_type = 'VEHICLE')
     OR (TG_OP = 'UPDATE' AND NEW.condition IS DISTINCT FROM OLD.condition AND NEW.asset_type = 'VEHICLE') THEN
    NEW.vehicle_condition := CASE
      WHEN NEW.condition = 'brand_new' THEN 'new'
      WHEN NEW.condition = 'refurbished' THEN 'certified'
      WHEN NEW.condition = 'nigerian_used' THEN 'used'
      ELSE NEW.condition
    END;
  ELSIF NEW.condition = 'new' THEN
    NEW.condition := 'brand_new';
  ELSIF NEW.condition = 'certified' THEN
    NEW.condition := 'refurbished';
  ELSIF NEW.condition = 'used' THEN
    NEW.condition := 'nigerian_used';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
