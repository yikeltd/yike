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
  if (isWhatsappNumberVerified(profile)) return "Verified";
  if (profile.whatsapp_verification_status === "admin_required") {
    return "Verification required";
  }
  return null;
}
