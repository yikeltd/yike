import type { Profile } from "@/types/database";
import { isAgentRole, isVerifiedAgentProfile } from "@/lib/agent-tiers";
import { normalizeAccountStatus } from "@/lib/account-control";
import { hasBasicListingProfile } from "@/lib/profile/basic-listing-profile";
import type { AdaptiveTrustLevel } from "./constants";
import type { VerificationControlConfig } from "./config";

export type TrustProfileSlice = Pick<
  Profile,
  | "role"
  | "email_verified"
  | "phone_verified"
  | "whatsapp"
  | "phone"
  | "full_name"
  | "date_of_birth"
  | "residential_address"
  | "residential_area"
  | "residential_city"
  | "residential_state"
  | "residential_postal_code"
  | "country"
  | "office_address"
  | "verified_badge"
  | "verification_status"
  | "account_status"
  | "profile_status"
  | "is_banned"
  | "verification_required"
  | "adaptive_trust_level"
  | "adaptive_trust_override"
  | "verification_escalated_at"
  | "listing_rules_accepted_at"
  | "bank_verified"
  | "company_verified"
  | "account_type"
  | "avatar_url"
  | "cac_number"
  | "cac_document_path"
>;

/** Effective level — admin override wins; escalated floor applies. */
export function effectiveTrustLevel(profile: Partial<TrustProfileSlice> & Pick<TrustProfileSlice, "is_banned">): AdaptiveTrustLevel {
  if (profile.adaptive_trust_override != null) {
    return clampLevel(profile.adaptive_trust_override);
  }

  if (profile.is_banned) return 5;

  const status = normalizeAccountStatus(profile);
  if (status === "suspended" || status === "deleted") return 5;
  if (status === "on_hold") return Math.max(4, profile.adaptive_trust_level ?? 4) as AdaptiveTrustLevel;

  const stored = profile.adaptive_trust_level ?? 0;
  const computed = computeSuggestedTrustLevel(profile);

  if (profile.verification_escalated_at || profile.verification_required) {
    return clampLevel(Math.max(stored, computed, 4));
  }

  return clampLevel(Math.max(stored, computed));
}

function clampLevel(n: number): AdaptiveTrustLevel {
  return Math.min(5, Math.max(0, Math.round(n))) as AdaptiveTrustLevel;
}

/** Suggested level from organic signals — does NOT auto-ban. */
export function computeSuggestedTrustLevel(profile: Partial<TrustProfileSlice>): AdaptiveTrustLevel {
  if (profile.is_banned) return 5;

  const hasEmail = profile.email_verified;
  const hasName = Boolean(profile.full_name?.trim());
  const isLister = isAgentRole(profile.role);
  const listingReady =
    isLister &&
    Boolean(profile.listing_rules_accepted_at) &&
    hasName &&
    hasBasicListingProfile(profile);
  const verifiedAgent = isVerifiedAgentProfile({
    role: profile.role ?? "user",
    verification_status: profile.verification_status ?? "not_started",
    verified_badge: profile.verified_badge ?? false,
    listing_limit: null,
  });
  const bankOk = profile.bank_verified;
  const companyOk =
    profile.company_verified ||
    profile.account_type === "individual" ||
    profile.account_type === "landlord";

  if (!hasEmail) return 0;
  if (!isLister) return 1;
  if (!listingReady) return 1;
  if (!verifiedAgent) return 2;
  if (verifiedAgent && bankOk && companyOk) return 3;
  if (verifiedAgent) return 3;

  return 2;
}

export function minimumLevelForRole(
  accountType: Profile["account_type"] | null | undefined
): AdaptiveTrustLevel {
  switch (accountType) {
    case "field_verifier":
    case "legal_partner":
      return 4;
    case "city_ambassador":
      return 3;
    case "agency":
    case "developer":
      return 3;
    case "individual":
    case "landlord":
      return 2;
    default:
      return 0;
  }
}

export function meetsRoleMinimum(
  profile: TrustProfileSlice,
  config: VerificationControlConfig
): boolean {
  const level = effectiveTrustLevel(profile);
  const min = minimumLevelForRole(profile.account_type);
  if (level < min) return false;
  if (config.bank_verification_required && isAgentRole(profile.role) && !profile.bank_verified) {
    return level >= 4;
  }
  return true;
}
