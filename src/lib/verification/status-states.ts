import type { Profile } from "@/types/database";
import { normalizeAccountStatus } from "@/lib/account-control";

export type CanonicalVerificationState =
  | "NOT_STARTED"
  | "PENDING_REVIEW"
  | "VERIFIED"
  | "REJECTED";

export type VerificationState =
  | "unverified"
  | "partially_verified"
  | "verified_contact"
  | "verified_listing"
  | "verified_agent"
  | "verified_company"
  | "enhanced_review_required"
  | "restricted"
  | "suspended";

export const CANONICAL_VERIFICATION_LABELS: Record<CanonicalVerificationState, string> = {
  NOT_STARTED: "Not Verified",
  PENDING_REVIEW: "Verification Pending",
  VERIFIED: "Verified",
  REJECTED: "Verification Unsuccessful",
};

export const CANONICAL_VERIFICATION_DESCRIPTIONS: Record<CanonicalVerificationState, string> = {
  NOT_STARTED: "Verify your identity or business to gain buyer trust and unlock listings.",
  PENDING_REVIEW: "Your documents are under review. Estimated review time: 1–2 business days.",
  VERIFIED: "Your identity and business details are verified on Yike.",
  REJECTED: "Your verification request was not approved. You can resubmit updated documents.",
};

export const VERIFICATION_STATE_LABELS: Record<VerificationState, string> = {
  unverified: "Not Verified",
  partially_verified: "Partially Verified",
  verified_contact: "Verified Contact",
  verified_listing: "Verified Seller",
  verified_agent: "Verified",
  verified_company: "Verified",
  enhanced_review_required: "Verification Pending",
  restricted: "Restricted",
  suspended: "Suspended",
};

export function getCanonicalVerificationState(
  profile: Partial<Profile> | null
): CanonicalVerificationState {
  if (!profile) return "NOT_STARTED";

  if (profile.is_banned) return "REJECTED";

  const vStatus = String(profile.verification_status || "").toLowerCase();
  const vLevel = String(profile.seller_verification_level || "").toLowerCase();
  const role = String(profile.role || "").toLowerCase();

  if (
    profile.verified_badge ||
    vStatus === "approved" ||
    vStatus === "verified" ||
    role === "agent_verified" ||
    vLevel === "business" ||
    vLevel === "identity"
  ) {
    return "VERIFIED";
  }

  if (
    vStatus === "pending" ||
    vStatus === "under_review" ||
    vStatus === "pending_verification" ||
    profile.verification_required
  ) {
    return "PENDING_REVIEW";
  }

  if (vStatus === "rejected" || vStatus === "failed") {
    return "REJECTED";
  }

  return "NOT_STARTED";
}

export function deriveVerificationState(
  profile: Pick<Profile, "is_banned" | "role"> & Partial<Profile>
): VerificationState {
  const status = getCanonicalVerificationState(profile);
  if (status === "VERIFIED") return "verified_agent";
  if (status === "PENDING_REVIEW") return "enhanced_review_required";
  if (status === "REJECTED") return "suspended";
  return "unverified";
}

export function levelForEnforcementAction(action: string): number | null {
  switch (action) {
    case "require_whatsapp":
    case "require_enhanced_review":
    case "require_bank":
      return 4;
    case "restrict_listing":
    case "pause_leads":
      return 5;
    case "escalate_trust":
      return 4;
    case "restore_trust":
    case "remove_escalation":
      return 2;
    case "revoke_verification":
      return 1;
    default:
      return null;
  }
}
