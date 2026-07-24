import { createHash } from "crypto";
import { generateOtp, hashOtp, verifyOtpHash } from "@/lib/otp/crypto";
import { otpExpiryMinutes } from "@/lib/notifications/providers/sendchamp-verification";

/** Prefix for server-stored OTP hashes in provider_reference (no Sendchamp session). */
export const LOCAL_OTP_REF_PREFIX = "local:";

export function buildLocalOtpReference(code: string): string {
  return `${LOCAL_OTP_REF_PREFIX}${hashOtp(code.trim())}`;
}

export function isLocalOtpReference(reference: string): boolean {
  return reference.startsWith(LOCAL_OTP_REF_PREFIX);
}

export function confirmLocalOtp(reference: string, code: string): boolean {
  if (!isLocalOtpReference(reference)) return false;
  const expectedHash = reference.slice(LOCAL_OTP_REF_PREFIX.length);
  return verifyOtpHash(code.trim(), expectedHash);
}

/** One 6-digit OTP + local reference for DB storage (never log the code). */
export function createLocalSmsOtp(): {
  code: string;
  reference: string;
  expiresMinutes: number;
} {
  const code = generateOtp();
  return {
    code,
    reference: buildLocalOtpReference(code),
    expiresMinutes: otpExpiryMinutes(),
  };
}

export function fingerprintPhone(phoneIntl: string): string {
  return createHash("sha256").update(phoneIntl).digest("hex").slice(0, 12);
}
