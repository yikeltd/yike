import type { Profile } from "@/types/database";
import { normalizeAccountStatus } from "@/lib/account-control";
import { isVerifiedAgentProfile, isAgentRole } from "@/lib/agent-tiers";
import type { AdaptiveTrustLevel } from "./constants";
import { effectiveTrustLevel, type TrustProfileSlice } from "./levels";

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

export const VERIFICATION_STATE_LABELS: Record<VerificationState, string> = {
  unverified: "Unverified",
  partially_verified: "Partially verified",
  verified_contact: "Verified contact",
  verified_listing: "Verified listing account",
  verified_agent: "Verified agent",
  verified_company: "Verified company",
  enhanced_review_required: "Enhanced review required",
  restricted: "Restricted",
  suspended: "Suspended",
};

export function deriveVerificationState(
  profile: Partial<TrustProfileSlice> & Pick<TrustProfileSlice, "is_banned" | "role">
): VerificationState {
  const status = normalizeAccountStatus(profile);
  if (profile.is_banned || status === "suspended" || status === "deleted") {
    return "suspended";
  }

  const level = effectiveTrustLevel(profile);

  if (level >= 5 || status === "on_hold") return "restricted";
  if (level >= 4 || profile.verification_required) return "enhanced_review_required";

  if (
    profile.company_verified ||
    profile.account_type === "agency" ||
    profile.account_type === "developer"
  ) {
    if (isVerifiedAgentProfile({
      role: profile.role ?? "user",
      verification_status: profile.verification_status ?? "pending",
      verified_badge: profile.verified_badge ?? false,
      listing_limit: null,
    })) {
      return "verified_company";
    }
  }

  if (level >= 3 && isVerifiedAgentProfile({
    role: profile.role ?? "user",
    verification_status: profile.verification_status ?? "pending",
    verified_badge: profile.verified_badge ?? false,
    listing_limit: null,
  })) {
    return "verified_agent";
  }

  if (level >= 2 && isAgentRole(profile.role)) return "verified_listing";

  const hasContact =
    profile.phone_verified ||
    Boolean(profile.whatsapp?.trim() || profile.phone?.trim());
  if (hasContact && profile.email_verified) return "verified_contact";

  if (profile.email_verified || hasContact || profile.full_name) {
    return "partially_verified";
  }

  return "unverified";
}

export function levelForEnforcementAction(action: string): AdaptiveTrustLevel | null {
  switch (action) {
    case "require_whatsapp":
    case "require_enhanced_review":
      return 4;
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
