-- Agent verification column aliases per unified auth spec

ALTER TABLE agent_verifications
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS nin_encrypted TEXT;

UPDATE agent_verifications SET user_id = agent_id WHERE user_id IS NULL;
UPDATE agent_verifications SET nin_encrypted = nin_number_encrypted WHERE nin_encrypted IS NULL AND nin_number_encrypted IS NOT NULL;
