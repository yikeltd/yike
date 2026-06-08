import type { Profile } from "@/types/database";
import { isAgentRole } from "@/lib/agent-tiers";
import { normalizeAccountStatus } from "@/lib/account-control";
import type { VerificationControlConfig } from "./config";
import { effectiveTrustLevel, type TrustProfileSlice } from "./levels";
import type { AdaptiveTrustLevel } from "./constants";

export type TrustCapabilities = {
  level: AdaptiveTrustLevel;
  canBrowse: boolean;
  canSave: boolean;
  canInquire: boolean;
  canList: boolean;
  canEditListings: boolean;
  canReceiveLeads: boolean;
  canShowWhatsApp: boolean;
  canShowVerifiedBadge: boolean;
  canPremiumVisibility: boolean;
  verificationRequired: boolean;
  calmMessage: string | null;
};

const CALM_MESSAGE =
  "To continue listing or receiving leads, additional verification is required.";

export function getTrustCapabilities(
  profile: (Partial<TrustProfileSlice> & Pick<TrustProfileSlice, "role" | "is_banned">) | null | undefined,
  config: VerificationControlConfig = {
    email_verification_required: true,
    whatsapp_verification_required: true,
    bank_verification_required: false,
    listing_review_required: true,
    verified_badge_required: true,
    enhanced_review_required: false,
    company_verification_required: false,
    cac_verification_required: false,
    id_verification_enabled: false,
    selfie_verification_enabled: false,
    auto_escalation_enabled: false,
    listing_verification_required: false,
    device_abuse_monitoring_enabled: false,
    multi_account_detection_enabled: false,
  }
): TrustCapabilities {
  if (!profile || profile.is_banned) {
    return {
      level: 5,
      canBrowse: false,
      canSave: false,
      canInquire: false,
      canList: false,
      canEditListings: false,
      canReceiveLeads: false,
      canShowWhatsApp: false,
      canShowVerifiedBadge: false,
      canPremiumVisibility: false,
      verificationRequired: true,
      calmMessage: CALM_MESSAGE,
    };
  }

  const level = effectiveTrustLevel(profile);
  const status = normalizeAccountStatus(profile);
  const escalated =
    profile.verification_required ||
    level >= 4 ||
    status === "pending_verification" ||
    status === "on_hold";

  const canBrowse = level >= 0 && status !== "suspended" && status !== "deleted";
  const canSave = canBrowse;
  const canInquire = level >= 1 && !escalated;
  const listingGate =
    config.listing_verification_required && isAgentRole(profile.role) && level < 2;
  const canList =
    level >= 2 &&
    level < 5 &&
    isAgentRole(profile.role) &&
    !escalated &&
    !listingGate &&
    status === "active";
  const canEditListings = canList && level < 4;
  const canReceiveLeads =
    level >= 2 && level < 5 && !escalated && status === "active";
  const canShowWhatsApp = level >= 1 && level < 5;
  const canShowVerifiedBadge =
    level >= 3 &&
    Boolean(profile.verified_badge || profile.verification_status === "approved") &&
    (!config.verified_badge_required || Boolean(profile.verified_badge));
  const canPremiumVisibility = level >= 3;

  let calmMessage: string | null = null;
  if (escalated && isAgentRole(profile.role)) {
    calmMessage = CALM_MESSAGE;
  }

  if (config.bank_verification_required && isAgentRole(profile.role) && !profile.bank_verified && level >= 2) {
    calmMessage = CALM_MESSAGE;
  }

  return {
    level,
    canBrowse,
    canSave,
    canInquire,
    canList: canList && !(config.bank_verification_required && !profile.bank_verified && level < 4),
    canEditListings,
    canReceiveLeads: canReceiveLeads && !(config.bank_verification_required && !profile.bank_verified && level < 4),
    canShowWhatsApp,
    canShowVerifiedBadge,
    canPremiumVisibility,
    verificationRequired: Boolean(escalated || calmMessage),
    calmMessage,
  };
}

export function canShowPublicVerifiedBadge(profile: TrustProfileSlice): boolean {
  const level = effectiveTrustLevel(profile);
  return (
    level >= 3 &&
    Boolean(profile.verified_badge) &&
    (profile.verification_status === "approved" || profile.verified_badge)
  );
}

export function syncProfileTrustLevel(profile: Profile): AdaptiveTrustLevel {
  return effectiveTrustLevel(profile);
}
