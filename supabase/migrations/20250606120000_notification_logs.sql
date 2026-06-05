-- OTP + email delivery logs; extend phone OTP tracking

ALTER TABLE phone_otp_requests
  ADD COLUMN IF NOT EXISTS attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS channel TEXT,
  ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'sendchamp',
  ADD COLUMN IF NOT EXISTS provider_reference TEXT,
  ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS otp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  channel TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'sendchamp',
  status TEXT NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS otp_logs_phone_created_idx ON otp_logs (phone, created_at DESC);

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'resend',
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS email_logs_email_type_idx ON email_logs (email, type, created_at DESC);

ALTER TABLE otp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
