-- Unified auth: single signup, phone/email verification, agent verification on demand

-- Profiles: new fields
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pin_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique
  ON profiles (LOWER(username))
  WHERE username IS NOT NULL;

-- Migrate verification_status values to new enum
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_verification_status_check;
UPDATE profiles SET verification_status = 'not_started' WHERE verification_status = 'unverified';
UPDATE profiles SET verification_status = 'approved' WHERE verification_status = 'verified';
ALTER TABLE profiles
  ALTER COLUMN verification_status SET DEFAULT 'not_started';
ALTER TABLE profiles
  ADD CONSTRAINT profiles_verification_status_check
  CHECK (verification_status IN ('not_started', 'pending', 'approved', 'rejected'));

-- Force role=user at signup (ignore metadata role escalation)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, full_name, phone, username, email, role, verification_status
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NULLIF(NEW.raw_user_meta_data->>'username', ''),
    NEW.email,
    'user',
    'not_started'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Phone OTP (pre-signup)
CREATE TABLE IF NOT EXISTS phone_otp_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  verification_token TEXT,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS phone_otp_phone_idx ON phone_otp_requests (phone, created_at DESC);

ALTER TABLE phone_otp_requests ENABLE ROW LEVEL SECURITY;

-- Agent verifications: align with spec (user_id alias via view; keep agent_id for compat)
ALTER TABLE agent_verifications
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

UPDATE agent_verifications SET submitted_at = created_at WHERE submitted_at IS NULL;

-- Listing insert: verified listers (not role-based)
DROP POLICY IF EXISTS "Agents insert own listings" ON properties;
CREATE POLICY "Verified listers insert own listings"
  ON properties FOR INSERT
  WITH CHECK (
    agent_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND verification_status = 'approved'
        AND is_banned = FALSE
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
        AND is_banned = FALSE
    )
  );

-- Agent verifications: any authenticated user can manage own
DROP POLICY IF EXISTS "Agents manage own verification" ON agent_verifications;
CREATE POLICY "Users manage own verification"
  ON agent_verifications FOR ALL
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());
