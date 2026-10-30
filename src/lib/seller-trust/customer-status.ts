import type { SellerTrustProfileSlice } from "./status";
import { isVerifiedSeller } from "./status";
import { isSellerReadyToList } from "./onboarding";

/** Customer-facing seller verification states (never expose admin/AI internals). */
export type SellerCustomerVerificationStatus =
  | "setup_required"
  | "checking"
  | "verified"
  | "action_needed";

export const SELLER_CUSTOMER_STATUS_LABELS: Record<
  SellerCustomerVerificationStatus,
  string
> = {
  setup_required: "Complete seller details",
  checking: "Checking your details",
  verified: "Verified",
  action_needed: "Action needed",
};

export function deriveSellerCustomerVerificationStatus(
  profile: Partial<SellerTrustProfileSlice> | null | undefined
): SellerCustomerVerificationStatus {
  if (!profile || profile.is_banned) {
    return "action_needed";
  }
  if (profile.verification_status === "rejected") {
    return "action_needed";
  }
  if (isVerifiedSeller(profile)) {
    return "verified";
  }
  if (
    profile.verification_status === "pending" ||
    (isSellerReadyToList(profile) && profile.verification_submitted_at)
  ) {
    return "checking";
  }
  if (!isSellerReadyToList(profile)) {
    return "setup_required";
  }
  return "checking";
}
