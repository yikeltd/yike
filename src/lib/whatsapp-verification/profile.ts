import type { Profile } from "@/types/database";
import { isWhatsappProfileVerificationEnabled } from "@/lib/feature-flags";

export type WhatsappVerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "admin_required";

export function getWhatsappNumber(profile: Partial<Profile>): string {
  return (profile.whatsapp ?? profile.phone ?? "").trim();
}

export function isWhatsappNumberVerified(profile: Partial<Profile>): boolean {
  if (profile.whatsapp_verification_status === "verified") return true;
  return Boolean(profile.whatsapp_verified_at);
}

export function mustVerifyWhatsappBeforeListing(profile: Partial<Profile>): boolean {
  if (!isWhatsappProfileVerificationEnabled()) return false;
  if (isWhatsappNumberVerified(profile)) return false;
  if (profile.whatsapp_verification_status === "admin_required") return true;
  return true;
}

export function whatsappVerifyBadgeLabel(profile: Partial<Profile>): string | null {
  if (isWhatsappNumberVerified(profile)) return "WhatsApp verified";
  if (profile.whatsapp_verification_status === "admin_required") {
    return "Required";
  }
  if (getWhatsappNumber(profile)) return "Unverified";
  return null;
}

/** Client-safe: show verify UI when server feature is on (even if NEXT_PUBLIC env is unset). */
export function isWhatsappVerificationFeatureActive(
  profile: Partial<Profile>
): boolean {
  const raw = process.env.NEXT_PUBLIC_ENABLE_WHATSAPP_OTP?.trim().toLowerCase();
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  if (profile.whatsapp_verification_status || profile.whatsapp_verified_at) return true;
  if (getWhatsappNumber(profile) && !isWhatsappNumberVerified(profile)) return true;
  return false;
}
