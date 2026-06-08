import type { AgentProfileStatus, Profile } from "@/types/database";
import { isVerifiedAgentProfile } from "@/lib/agent-tiers";
import { getTrustCapabilities } from "@/lib/verification/permissions";
import type { TrustProfileSlice } from "@/lib/verification/levels";
import {
  ACCOUNT_ON_HOLD_MESSAGE,
  ACCOUNT_PENDING_VERIFICATION_MESSAGE,
  ACCOUNT_SUSPENDED_MESSAGE,
  LISTING_LIMIT_REACHED_MESSAGE,
  TRUST_SETUP_TITLE,
} from "@/lib/copy/user-messages";

export type AccountStatus =
  | "active"
  | "on_hold"
  | "suspended"
  | "deleted"
  | "pending_verification";

export { LISTING_LIMIT_REACHED_MESSAGE } from "@/lib/copy/user-messages";

export const ACCOUNT_STATUS_MESSAGES: Record<AccountStatus, string | null> = {
  active: null,
  on_hold: ACCOUNT_ON_HOLD_MESSAGE,
  suspended: ACCOUNT_SUSPENDED_MESSAGE,
  deleted: "This account is no longer active. Contact support if you need help.",
  pending_verification: ACCOUNT_PENDING_VERIFICATION_MESSAGE,
};

export function normalizeAccountStatus(
  profile:
    | Pick<Profile, "account_status" | "profile_status">
    | { account_status?: string | null; profile_status?: string | null }
    | null
    | undefined
): AccountStatus {
  const raw =
    profile?.account_status ??
    (profile?.profile_status === "reinstated" ? "active" : profile?.profile_status) ??
    "active";
  if (
    raw === "on_hold" ||
    raw === "suspended" ||
    raw === "deleted" ||
    raw === "pending_verification"
  ) {
    return raw;
  }
  return "active";
}

export function accountStatusMessage(
  profile: Pick<
    Profile,
    "account_status" | "profile_status" | "verification_required"
  > | null | undefined
): string | null {
  if (!profile) return null;
  const status = normalizeAccountStatus(profile);
  const caps = getTrustCapabilities(profile as TrustProfileSlice);
  if (caps.calmMessage && status === "active") {
    return caps.calmMessage;
  }
  if (profile.verification_required && status === "active") {
    return TRUST_SETUP_TITLE;
  }
  return ACCOUNT_STATUS_MESSAGES[status];
}

type TrustGateProfile = Pick<
  Profile,
  "is_banned" | "account_status" | "profile_status" | "verification_required" | "role"
> &
  Partial<TrustProfileSlice>;

export function canPublishListings(
  profile: TrustGateProfile | null | undefined
): boolean {
  if (!profile || profile.is_banned) return false;
  const status = normalizeAccountStatus(profile);
  if (status === "suspended" || status === "deleted") return false;
  if (status === "on_hold" || status === "pending_verification") return false;
  const caps = getTrustCapabilities(profile as TrustProfileSlice);
  return caps.canList;
}

export function canReceiveDirectLeads(
  profile: TrustGateProfile | null | undefined
): boolean {
  if (!profile || profile.is_banned) return false;
  const status = normalizeAccountStatus(profile);
  if (status === "suspended" || status === "deleted" || status === "on_hold") {
    return false;
  }
  const caps = getTrustCapabilities(profile as TrustProfileSlice);
  return caps.canReceiveLeads;
}

export function isAccountRestricted(
  profile: Pick<Profile, "is_banned" | "account_status" | "profile_status"> | null
): boolean {
  if (!profile?.is_banned) {
    const status = normalizeAccountStatus(profile);
    return status !== "active";
  }
  return true;
}

export function defaultListingLimitForProfile(
  profile: Pick<Profile, "verification_status" | "verified_badge" | "role" | "listing_limit"> | null
): number | null {
  if (!profile) return 5;
  if (isVerifiedAgentProfile(profile)) return null;
  return 5;
}

export function profileStatusFromAccountAction(
  action: AccountStatus | "reinstate" | "suspend" | "delete"
): AgentProfileStatus {
  switch (action) {
    case "active":
    case "reinstate":
      return "reinstated";
    case "on_hold":
      return "on_hold";
    case "pending_verification":
      return "pending_verification";
    case "suspend":
    case "suspended":
      return "suspended";
    case "delete":
    case "deleted":
      return "deleted";
    default:
      return "active";
  }
}
