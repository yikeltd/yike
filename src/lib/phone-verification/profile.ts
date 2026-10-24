import type { Profile } from "@/types/database";
import { isAuthSmsVerificationBypassActive } from "@/lib/auth/sms-verification-flag";
import { isPhoneOtpEnabled, isSmsOtpEnabled } from "@/lib/feature-flags";

function isSellerSmsOtpUiEnabled(): boolean {
  if (isAuthSmsVerificationBypassActive()) return false;
  return isPhoneOtpEnabled() && isSmsOtpEnabled();
}

/** Seller contact line (local Nigerian digits when available). */
export function getSellerContactPhone(profile: Partial<Profile>): string {
  return (profile.phone ?? profile.whatsapp ?? "").trim();
}

/** @deprecated Use getSellerContactPhone */
export const getWhatsappNumber = getSellerContactPhone;

export function isSellerPhoneVerified(profile: Partial<Profile>): boolean {
  return Boolean(profile.phone_verified);
}

/** Staff can force re-verification via legacy `whatsapp_verification_status`. */
export function isAdminRequiredPhoneVerification(profile: Partial<Profile>): boolean {
  return profile.whatsapp_verification_status === "admin_required";
}

export function mustVerifyPhoneOnProfile(profile: Partial<Profile>): boolean {
  if (isSellerPhoneVerified(profile)) return false;
  if (isAdminRequiredPhoneVerification(profile)) return true;
  if (!isSellerSmsOtpUiEnabled()) return false;
  return Boolean(getSellerContactPhone(profile));
}

export function phoneVerifyBadgeLabel(profile: Partial<Profile>): string | null {
  if (isSellerPhoneVerified(profile)) return "Phone verified";
  if (isAdminRequiredPhoneVerification(profile)) return "Required";
  if (getSellerContactPhone(profile)) return "Unverified";
  return null;
}

/** Client-safe: show SMS verify UI when seller phone OTP is enabled. */
export function isPhoneVerificationFeatureActive(profile: Partial<Profile>): boolean {
  if (isSellerSmsOtpUiEnabled()) return true;
  const raw = process.env.NEXT_PUBLIC_ENABLE_PHONE_OTP?.trim().toLowerCase();
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  if (profile.phone_verified || profile.phone_verified_at) return true;
  if (getSellerContactPhone(profile) && !isSellerPhoneVerified(profile)) return true;
  return false;
}
