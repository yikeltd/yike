-- WhatsApp number verification (Sendchamp) — profile state + server-side sessions

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp_verification_status TEXT NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS whatsapp_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS whatsapp_verification_reference TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_verification_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS whatsapp_verification_attempts INT NOT NULL DEFAULT 0;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_whatsapp_verification_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_whatsapp_verification_status_check
  CHECK (
    whatsapp_verification_status IN (
      'unverified',
      'pending',
      'verified',
      'admin_required'
    )
  );

CREATE TABLE IF NOT EXISTS public.whatsapp_otp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  phone_local TEXT NOT NULL,
  phone_intl TEXT NOT NULL,
  provider_reference TEXT,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  status TEXT NOT NULL DEFAULT 'sent',
  verify_attempts INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consumed_at TIMESTAMPTZ,
  ip_hash TEXT,
  CONSTRAINT whatsapp_otp_sessions_status_check
    CHECK (status IN ('sent', 'verified', 'expired', 'failed'))
);

CREATE INDEX IF NOT EXISTS whatsapp_otp_sessions_user_created_idx
  ON public.whatsapp_otp_sessions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS whatsapp_otp_sessions_phone_created_idx
  ON public.whatsapp_otp_sessions (phone_intl, created_at DESC);

ALTER TABLE public.whatsapp_otp_sessions ENABLE ROW LEVEL SECURITY;
