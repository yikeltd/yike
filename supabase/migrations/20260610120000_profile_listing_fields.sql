-- Basic profile fields for listing onboarding (address + DOB).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS residential_address TEXT,
  ADD COLUMN IF NOT EXISTS residential_area TEXT,
  ADD COLUMN IF NOT EXISTS residential_city TEXT,
  ADD COLUMN IF NOT EXISTS residential_state TEXT,
  ADD COLUMN IF NOT EXISTS residential_postal_code TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'Nigeria';
