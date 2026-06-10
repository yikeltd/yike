import type { Profile } from "@/types/database";
import {
  canListProperties,
  isAgentRole,
  isVerifiedAgentProfile,
} from "@/lib/agent-tiers";
import { canShowPublicVerifiedBadge } from "@/lib/verification/permissions";

export type ProfilePersona =
  | "user"
  | "agent"
  | "company"
  | "city_ambassador"
  | "field_verifier"
  | "legal_partner"
  | "staff";

export function getProfilePersona(profile: Profile): ProfilePersona {
  if (
    profile.role === "admin" ||
    profile.role === "super_admin" ||
    profile.role === "moderator" ||
    profile.role === "support" ||
    profile.role === "tech" ||
    profile.role === "content"
  ) {
    return "staff";
  }
  if (profile.account_type === "city_ambassador") return "city_ambassador";
  if (profile.account_type === "field_verifier") return "field_verifier";
  if (profile.account_type === "legal_partner") return "legal_partner";
  if (
    profile.account_type === "agency" ||
    profile.account_type === "developer" ||
    Boolean(profile.company_name)
  ) {
    return "company";
  }
  if (isAgentRole(profile.role)) return "agent";
  return "user";
}

export function showAgentBadge(profile: Profile, verified: boolean): boolean {
  if (!isAgentRole(profile.role)) return false;
  return canShowPublicVerifiedBadge(profile) || verified;
}

export type SellerType = "agent" | "landlord" | "company";

export function getSellerType(profile: Profile): SellerType | null {
  if (!isAgentRole(profile.role)) return null;
  if (
    profile.account_type === "agency" ||
    profile.account_type === "developer" ||
    Boolean(profile.company_name)
  ) {
    return "company";
  }
  if (profile.account_type === "landlord") return "landlord";
  return "agent";
}

export function sellerTypeLabel(type: SellerType): string {
  if (type === "company") return "Company";
  if (type === "landlord") return "Landlord";
  return "Agent";
}

export function listedByLabel(type: SellerType): string {
  return `Listed by ${sellerTypeLabel(type)}`;
}

export function profileTypeHeading(type: SellerType): string {
  if (type === "company") return "Company profile";
  if (type === "landlord") return "Landlord profile";
  return "Agent profile";
}

export function profileRoleLabel(profile: Profile, verified: boolean): string | null {
  const sellerType = getSellerType(profile);
  if (!sellerType) {
    const persona = getProfilePersona(profile);
    if (persona === "user") return null;
    if (persona === "city_ambassador") return "Ambassador";
    if (persona === "field_verifier") return "Verifier";
    if (persona === "legal_partner") return "Legal partner";
    return null;
  }
  if (verified) return sellerTypeLabel(sellerType);
  return sellerTypeLabel(sellerType);
}

export type ListingJourneyStep = {
  id: string;
  label: string;
  done: boolean;
  current: boolean;
};

export function listingVerificationJourney(
  profile: Profile,
  verified: boolean
): ListingJourneyStep[] {
  if (!canListProperties(profile)) return [];

  const hasName = Boolean(profile.full_name?.trim());
  const hasPhoto = Boolean(profile.avatar_url);
  const canPublish =
    !profile.verification_required &&
    profile.account_status !== "on_hold" &&
    profile.account_status !== "pending_verification";

  const steps: ListingJourneyStep[] = [
    {
      id: "profile",
      label: "Profile & photo",
      done: hasName && hasPhoto,
      current: !hasName || !hasPhoto,
    },
    {
      id: "review",
      label: "Ready to list",
      done: canPublish,
      current: hasName && hasPhoto && !canPublish,
    },
    {
      id: "verified",
      label: "Verified badge (optional)",
      done: verified,
      current: canPublish && !verified,
    },
  ];

  return steps;
}

export function formatListingSlots(
  activeCount: number,
  limit: number | null,
  verified: boolean
): string {
  if (limit === null && verified) return "Unlimited listing access";
  if (limit === null) return "Verified listing access";
  return `${activeCount} of ${limit} listing slots used`;
}

export function hasWhatsAppForListing(profile: Profile): boolean {
  return Boolean(profile.whatsapp?.trim() || profile.phone?.trim());
}

export function agentOnboardingComplete(profile: Profile): boolean {
  return (
    canListProperties(profile) &&
    Boolean(profile.full_name?.trim()) &&
    Boolean(profile.avatar_url) &&
    Boolean(profile.account_type)
  );
}
