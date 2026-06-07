import type { AgentProfileStatus, Profile } from "@/types/database";
import { isVerifiedAgentProfile } from "@/lib/agent-tiers";

export type AccountStatus =
  | "active"
  | "on_hold"
  | "suspended"
  | "deleted"
  | "pending_verification";

export const LISTING_LIMIT_REACHED_MESSAGE =
  "You've reached your current listing limit. Please contact Yike to verify your account or request an upgrade.";

export const ACCOUNT_STATUS_MESSAGES: Record<AccountStatus, string | null> = {
  active: null,
  on_hold: "Your account is currently under review. Please contact Yike support.",
  suspended: "Your account access has been restricted. Please contact Yike support.",
  deleted: "This account is no longer active. Please contact Yike support.",
  pending_verification:
    "Yike needs a few details to verify your account before you continue posting listings.",
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
  if (profile.verification_required && status === "active") {
    return ACCOUNT_STATUS_MESSAGES.pending_verification;
  }
  return ACCOUNT_STATUS_MESSAGES[status];
}

export function canPublishListings(
  profile: Pick<
    Profile,
    | "is_banned"
    | "account_status"
    | "profile_status"
    | "verification_required"
    | "role"
  > | null | undefined
): boolean {
  if (!profile || profile.is_banned) return false;
  const status = normalizeAccountStatus(profile);
  if (status === "suspended" || status === "deleted") return false;
  if (status === "on_hold" || status === "pending_verification") return false;
  if (profile.verification_required) return false;
  return true;
}

export function canReceiveDirectLeads(
  profile: Pick<
    Profile,
    "is_banned" | "account_status" | "profile_status"
  > | null | undefined
): boolean {
  if (!profile || profile.is_banned) return false;
  const status = normalizeAccountStatus(profile);
  if (status === "suspended" || status === "deleted" || status === "on_hold") {
    return false;
  }
  return true;
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
