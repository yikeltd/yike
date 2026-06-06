-- Agent verification personal details + provider metadata

ALTER TABLE agent_verifications
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS residential_address TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS occupation TEXT,
  ADD COLUMN IF NOT EXISTS nin_provider TEXT,
  ADD COLUMN IF NOT EXISTS nin_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS provider_reference TEXT;
