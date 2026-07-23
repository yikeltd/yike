import type { Profile } from "@/types/database";
import {
  deriveSellerLaunchStatus,
  isPhoneVerifiedForSeller,
  isVerifiedSeller,
  type SellerTrustProfileSlice,
} from "./status";
import { isSellerProfileComplete } from "./onboarding";

export const PHONE_VERIFY_BEFORE_LISTING_MESSAGE =
  "Verify your phone to start selling.";

export const SELLER_PROFILE_BEFORE_LISTING_MESSAGE =
  "Complete your seller profile to start listing.";

export const SELLER_VERIFY_BEFORE_PUBLISH_MESSAGE =
  "Seller verification is required before this listing can go live.";

export const SELLER_PENDING_MANUAL_MESSAGE =
  "Your seller verification is under review. Listings stay in review until approved.";

export type ListingCreateGateResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | "email_verification_required"
        | "phone_verification_required"
        | "seller_profile_required"
        | "seller_suspended"
        | "seller_rejected";
      error: string;
    };

export type ListingPublishGateResult =
  | { ok: true }
  | {
      ok: false;
      code: "seller_verification_required" | "seller_suspended" | "seller_rejected";
      error: string;
    };

type GateProfile = Partial<SellerTrustProfileSlice> &
  Pick<Profile, "email_verified" | "is_banned" | "role">;

/** Create/submit listing — email + phone + seller profile required; badge not yet required. */
export function assertCanCreateListing(
  profile: GateProfile | null | undefined
): ListingCreateGateResult {
  if (!profile || profile.is_banned) {
    return {
      ok: false,
      code: "seller_suspended",
      error: "Account unavailable",
    };
  }

  const status = deriveSellerLaunchStatus(profile);
  if (status === "suspended") {
    return {
      ok: false,
      code: "seller_suspended",
      error: "Account unavailable",
    };
  }
  if (status === "rejected") {
    return {
      ok: false,
      code: "seller_rejected",
      error: "Seller verification was not approved. Contact support.",
    };
  }

  if (!profile.email_verified) {
    return {
      ok: false,
      code: "email_verification_required",
      error: "Verify your email to list.",
    };
  }

  if (!isPhoneVerifiedForSeller(profile)) {
    return {
      ok: false,
      code: "phone_verification_required",
      error: PHONE_VERIFY_BEFORE_LISTING_MESSAGE,
    };
  }

  if (!isSellerProfileComplete(profile)) {
    return {
      ok: false,
      code: "seller_profile_required",
      error: SELLER_PROFILE_BEFORE_LISTING_MESSAGE,
    };
  }

  return { ok: true };
}

/**
 * Publish / approve listing live — requires Verified Seller.
 * Phone + profile alone are not enough.
 */
export function assertCanPublishListing(
  profile: GateProfile | null | undefined
): ListingPublishGateResult {
  if (!profile || profile.is_banned) {
    return {
      ok: false,
      code: "seller_suspended",
      error: "Account unavailable",
    };
  }

  const status = deriveSellerLaunchStatus(profile);
  if (status === "suspended") {
    return {
      ok: false,
      code: "seller_suspended",
      error: "Account unavailable",
    };
  }
  if (status === "rejected") {
    return {
      ok: false,
      code: "seller_rejected",
      error: "Seller verification was not approved.",
    };
  }

  if (!isVerifiedSeller(profile)) {
    return {
      ok: false,
      code: "seller_verification_required",
      error: SELLER_VERIFY_BEFORE_PUBLISH_MESSAGE,
    };
  }

  return { ok: true };
}

export function mustVerifyPhoneBeforeListing(
  profile: Partial<SellerTrustProfileSlice> | null | undefined
): boolean {
  return !isPhoneVerifiedForSeller(profile);
}
