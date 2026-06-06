-- Phone OTP: delivery status tracking for Sendchamp-only flow

ALTER TABLE phone_otp_requests
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

ALTER TABLE phone_otp_requests DROP CONSTRAINT IF EXISTS phone_otp_requests_status_check;
ALTER TABLE phone_otp_requests
  ADD CONSTRAINT phone_otp_requests_status_check
  CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'verified', 'expired'));

ALTER TABLE otp_logs
  ADD COLUMN IF NOT EXISTS error_message TEXT;
