-- Expand deal types: rent, lease (land/commercial), sale, shortlet

ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_listing_type_check;
ALTER TABLE properties ADD CONSTRAINT properties_listing_type_check
  CHECK (listing_type IN ('rent', 'lease', 'sale', 'shortlet'));
