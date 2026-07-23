import type { Profile } from "@/types/database";
import { normalizeAccountStatus } from "@/lib/account-control";
import { isVerifiedAgentProfile } from "@/lib/agent-tiers";
import { isWhatsappNumberVerified } from "@/lib/whatsapp-verification/profile";

/**
 * Launch seller trust statuses (Seller Verification & Onboarding v1).
 * Derived from existing profile fields + optional timestamps.
 * Conceptual DB chain:
 * UNVERIFIED → EMAIL_VERIFIED → PHONE_VERIFIED → PROFILE_COMPLETED →
 * PENDING_REVIEW → VERIFIED → REJECTED | SUSPENDED
 */
export type SellerLaunchStatus =
  | "unverified"
  | "email_verified"
  | "phone_verified"
  | "profile_completed"
  | "pending_manual_verification"
  | "verified_seller"
  | "suspended"
  | "rejected";

export const SELLER_LAUNCH_STATUS_LABELS: Record<SellerLaunchStatus, string> = {
  unverified: "Unverified",
  email_verified: "Email Verified",
  phone_verified: "Phone Verified",
  profile_completed: "Seller Profile Complete",
  pending_manual_verification: "Pending Manual Review",
  verified_seller: "Verified Seller",
  suspended: "Suspended",
  rejected: "Rejected",
};

/** Uppercase labels for admin / ops docs. */
export const SELLER_DB_STATUS_LABELS: Record<SellerLaunchStatus, string> = {
  unverified: "UNVERIFIED",
  email_verified: "EMAIL_VERIFIED",
  phone_verified: "PHONE_VERIFIED",
  profile_completed: "PROFILE_COMPLETED",
  pending_manual_verification: "PENDING_REVIEW",
  verified_seller: "VERIFIED",
  rejected: "REJECTED",
  suspended: "SUSPENDED",
};

/** Buyer-facing badge variant. */
export type SellerBuyerBadge =
  | "verified_seller"
  | "verification_pending"
  | "unverified_seller";

export const SELLER_BUYER_BADGE_LABELS: Record<SellerBuyerBadge, string> = {
  verified_seller: "Verified Seller",
  verification_pending: "Verification Pending",
  unverified_seller: "Unverified Seller",
};

export type SellerTrustProfileSlice = Pick<
  Profile,
  | "email_verified"
  | "phone_verified"
  | "phone_verified_at"
  | "whatsapp_verification_status"
  | "whatsapp_verified_at"
  | "verification_status"
  | "verified_badge"
  | "role"
  | "is_banned"
  | "account_status"
  | "profile_status"
  | "seller_profile_completed_at"
  | "verification_submitted_at"
  | "date_of_birth"
  | "residential_address"
  | "office_address"
  | "residential_state"
>;

/** Phone is verified via SMS OTP or WhatsApp OTP (both set phone_verified). */
export function isPhoneVerifiedForSeller(
  profile: Partial<SellerTrustProfileSlice> | null | undefined
): boolean {
  if (!profile) return false;
  if (profile.phone_verified) return true;
  return isWhatsappNumberVerified(profile);
}

export function isVerifiedSeller(
  profile: Partial<SellerTrustProfileSlice> | null | undefined
): boolean {
  if (!profile) return false;
  if (profile.verified_badge) return true;
  if (
    profile.verification_status === "approved" ||
    profile.verification_status === "verified"
  ) {
    return true;
  }
  return isVerifiedAgentProfile({
    role: profile.role ?? "user",
    verification_status: profile.verification_status ?? "not_started",
    verified_badge: profile.verified_badge ?? false,
    listing_limit: null,
  });
}

export function isSellerVerificationPending(
  profile: Partial<SellerTrustProfileSlice> | null | undefined
): boolean {
  if (!profile) return false;
  if (isVerifiedSeller(profile)) return false;
  return profile.verification_status === "pending";
}

export function deriveSellerLaunchStatus(
  profile: Partial<SellerTrustProfileSlice> | null | undefined
): SellerLaunchStatus {
  if (!profile) return "unverified";

  const account = normalizeAccountStatus(profile);
  if (profile.is_banned || account === "suspended" || account === "deleted") {
    return "suspended";
  }

  if (profile.verification_status === "rejected") {
    return "rejected";
  }

  if (isVerifiedSeller(profile)) {
    return "verified_seller";
  }

  if (profile.verification_status === "pending" || account === "pending_verification") {
    return "pending_manual_verification";
  }

  const profileComplete = Boolean(
    profile.seller_profile_completed_at ||
      (profile.date_of_birth &&
        (profile.residential_address?.trim() || profile.office_address?.trim()) &&
        profile.residential_state?.trim())
  );

  if (
    isPhoneVerifiedForSeller(profile) &&
    profile.email_verified &&
    profileComplete &&
    profile.verification_submitted_at
  ) {
    return "pending_manual_verification";
  }

  if (isPhoneVerifiedForSeller(profile) && profile.email_verified && profileComplete) {
    return "profile_completed";
  }

  if (isPhoneVerifiedForSeller(profile) && profile.email_verified) {
    return "phone_verified";
  }

  if (profile.email_verified) {
    return "email_verified";
  }

  return "unverified";
}

export function deriveSellerBuyerBadge(
  profile: Partial<SellerTrustProfileSlice> | null | undefined
): SellerBuyerBadge {
  const status = deriveSellerLaunchStatus(profile);
  if (status === "verified_seller") return "verified_seller";
  if (
    status === "pending_manual_verification" ||
    status === "profile_completed" ||
    status === "phone_verified" ||
    status === "email_verified"
  ) {
    return "verification_pending";
  }
  return "unverified_seller";
}
