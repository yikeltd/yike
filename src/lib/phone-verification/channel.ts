import type { PhoneVerificationChannel } from "./types";

/**
 * Production default: SMS. WhatsApp / email are future channels only.
 * Env: SENDCHAMP_OTP_CHANNEL=sms|whatsapp|email
 */
export function resolveDefaultPhoneVerificationChannel(): PhoneVerificationChannel {
  const raw =
    process.env.SENDCHAMP_OTP_CHANNEL?.trim().toLowerCase() ||
    process.env.PHONE_OTP_CHANNEL?.trim().toLowerCase() ||
    "sms";

  if (raw === "whatsapp" || raw === "wa") return "whatsapp";
  if (raw === "email") return "email";
  return "sms";
}

export function isSmsPhoneVerificationChannel(
  channel: PhoneVerificationChannel
): boolean {
  return channel === "sms";
}
