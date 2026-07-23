import type { Profile } from "@/types/database";
import { isPhoneVerifiedForSeller, type SellerTrustProfileSlice } from "./status";

/**
 * Seller Verification & Onboarding v1 — progressive disclosure gates.
 *
 * Ready to open listing wizard when phone is verified AND seller profile
 * fields are complete. Live publish still requires Verified Seller (gates.ts).
 */

export type SellerOnboardingProfileSlice = Partial<
  SellerTrustProfileSlice &
    Pick<
      Profile,
      | "full_name"
      | "date_of_birth"
      | "residential_address"
      | "office_address"
      | "residential_state"
      | "residential_city"
      | "seller_profile_completed_at"
      | "phone_verified_at"
      | "verification_submitted_at"
    >
>;

/** Required seller-profile fields (Identity v1 — no separate city required). */
export function isSellerProfileComplete(
  profile: SellerOnboardingProfileSlice | null | undefined
): boolean {
  if (!profile) return false;
  if (profile.seller_profile_completed_at) return true;

  const address =
    profile.residential_address?.trim() || profile.office_address?.trim() || "";
  const state = profile.residential_state?.trim() || "";
  const dob = profile.date_of_birth?.trim() || "";

  return Boolean(address && state && dob);
}

/** Phone verified + seller profile complete → may enter listing wizard. */
export function isSellerReadyToList(
  profile: SellerOnboardingProfileSlice | null | undefined
): boolean {
  if (!profile) return false;
  if (profile.is_banned) return false;
  if (profile.verification_status === "rejected") return false;
  return isPhoneVerifiedForSeller(profile) && isSellerProfileComplete(profile);
}

export function mustCompleteSellerVerification(
  profile: SellerOnboardingProfileSlice | null | undefined
): boolean {
  return !isSellerReadyToList(profile);
}

export const SELLER_VERIFY_PATH = "/agent/verify";
export const SELLER_CHOOSE_LISTING_PATH = "/agent/listings/choose";

export type SellerTrustProgressStep =
  | "email"
  | "phone"
  | "seller_profile"
  | "manual_review";

export type SellerTrustProgressItem = {
  id: SellerTrustProgressStep;
  label: string;
  done: boolean;
  current: boolean;
};

export function buildSellerTrustProgress(
  profile: SellerOnboardingProfileSlice | null | undefined,
  opts?: { emailVerified?: boolean }
): SellerTrustProgressItem[] {
  const emailDone = Boolean(opts?.emailVerified ?? profile?.email_verified);
  const phoneDone = isPhoneVerifiedForSeller(profile);
  const profileDone = isSellerProfileComplete(profile);
  const reviewDone =
    profile?.verification_status === "approved" ||
    profile?.verification_status === "verified" ||
    Boolean(profile?.verified_badge);
  const reviewPending =
    profile?.verification_status === "pending" ||
    Boolean(profile?.verification_submitted_at);

  let current: SellerTrustProgressStep = "email";
  if (!emailDone) current = "email";
  else if (!phoneDone) current = "phone";
  else if (!profileDone) current = "seller_profile";
  else current = "manual_review";

  return [
    {
      id: "email",
      label: "Email",
      done: emailDone,
      current: current === "email",
    },
    {
      id: "phone",
      label: "Phone",
      done: phoneDone,
      current: current === "phone",
    },
    {
      id: "seller_profile",
      label: "Seller Profile",
      done: profileDone,
      current: current === "seller_profile",
    },
    {
      id: "manual_review",
      label: "Manual Review",
      done: reviewDone,
      current: current === "manual_review" || (profileDone && reviewPending && !reviewDone),
    },
  ];
}

export const SELLER_VERIFICATION_CONSENT =
  "I confirm that the information I have provided is accurate. I agree to follow Yike's marketplace rules and understand that false information or fraudulent listings may result in account suspension or permanent removal.";

export const SELLER_VERIFICATION_COPY = {
  title: "Verify Yourself to Start Listing",
  subtitle:
    "To keep Yike safe and trusted, every seller must verify their phone number and complete a short seller profile before publishing listings.",
  progressTitle: "Seller Verification",
  completeCta: "Complete Verification",
  phoneVerifiedLabel: "Phone Number Verified",
  addressHint: "House Number, Street, Area, City, Postal Code optional",
} as const;
