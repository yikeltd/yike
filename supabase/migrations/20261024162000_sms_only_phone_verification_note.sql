-- SMS-only phone verification (2026-10-24)
-- Application removed WhatsApp OTP verification paths. Seller SMS OTP continues to use
-- `whatsapp_otp_sessions` (historical name) with channel = 'sms'. No schema drop here:
-- legacy rows and profile whatsapp_* columns remain for contact display and admin enforcement.

COMMENT ON TABLE public.whatsapp_otp_sessions IS
  'Seller/auth phone OTP sessions (Sendchamp SMS). Table name is legacy; channel is sms.';
