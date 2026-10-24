import type { PhoneVerificationChannel } from "./types";

/** Production: Sendchamp SMS Verification API only (sender YIKE). */
export function resolveDefaultPhoneVerificationChannel(): PhoneVerificationChannel {
  return "sms";
}

export function isSmsPhoneVerificationChannel(
  channel: PhoneVerificationChannel,
): boolean {
  return channel === "sms";
}
