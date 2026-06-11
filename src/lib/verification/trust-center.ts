import type { Profile } from "@/types/database";
import { isAgentRole } from "@/lib/agent-tiers";
import { getProfilePersona } from "@/lib/profile-display";
import { hasBasicListingProfile } from "@/lib/profile/basic-listing-profile";
import {
  isWhatsappNumberVerified,
  isWhatsappVerificationFeatureActive,
} from "@/lib/whatsapp-verification/profile";
import { effectiveTrustLevel } from "./levels";

export type TrustItemStatus =
  | "complete"
  | "pending"
  | "optional"
  | "action_needed"
  | "under_review";

export type TrustProgressItem = {
  id: string;
  label: string;
  status: TrustItemStatus;
  href?: string;
  hidden?: boolean;
  group?: "listing_setup" | "trust_upgrade";
};

export type TrustStatusChip = {
  label: string;
  tone: "neutral" | "success" | "warning" | "premium";
};

export function getTrustStatusChip(
  profile: Profile,
  verified: boolean
): TrustStatusChip {
  const status = profile.verification_status;
  const level = effectiveTrustLevel(profile);

  if (verified || profile.verified_badge) {
    return { label: "Premium verified", tone: "premium" };
  }
  if (status === "pending" && profile.verified_badge) {
    return { label: "Under review", tone: "warning" };
  }
  if (level >= 3) {
    return { label: "Verified", tone: "success" };
  }
  if (level >= 2 && isAgentRole(profile.role)) {
    return { label: "Listing account", tone: "success" };
  }
  if (profile.email_verified && (profile.phone_verified || profile.whatsapp || profile.phone)) {
    return { label: "Basic verified", tone: "neutral" };
  }
  return { label: "Basic", tone: "neutral" };
}

export function getTrustProgressItems(
  profile: Profile,
  verified: boolean
): TrustProgressItem[] {
  const persona = getProfilePersona(profile);
  const isLister = isAgentRole(profile.role);
  const items: TrustProgressItem[] = [];

  items.push({
    id: "email",
    label: "Email verified",
    status: profile.email_verified ? "complete" : "action_needed",
    href: "/auth/verify-email",
    group: "listing_setup",
  });

  items.push({
    id: "profile_complete",
    label: "Personal details",
    status: hasBasicListingProfile(profile) ? "complete" : isLister ? "action_needed" : "optional",
    href: "/agent/profile-setup",
    group: "listing_setup",
  });

  if (isWhatsappVerificationFeatureActive(profile)) {
    items.push({
      id: "whatsapp",
      label: "WhatsApp verified",
      status: isWhatsappNumberVerified(profile) ? "complete" : "action_needed",
      href: "/agent/verification",
      group: "listing_setup",
    });
  }

  items.push({
    id: "profile_photo",
    label: "Profile photo",
    status: profile.avatar_url ? "complete" : "optional",
    href: "/agent",
    group: "listing_setup",
  });

  if (isLister) {
    if (persona === "company") {
      items.push({
        id: "company",
        label: "Company verification",
        status: profile.company_verified ? "complete" : "optional",
        href: "/agent/company",
        group: "trust_upgrade",
      });
    }

    if (verified) {
      items.push({
        id: "agent_badge",
        label: "Verified agent badge",
        status: "complete",
        href: "/agent/verification",
        group: "trust_upgrade",
      });
    } else {
      items.push({
        id: "agent_badge",
        label:
          profile.verification_status === "pending"
            ? "Verified agent badge (under review)"
            : "Verified agent badge",
        status:
          profile.verification_status === "pending" ? "under_review" : "optional",
        href: "/agent/verification",
        group: "trust_upgrade",
      });
    }
  }

  return items.filter((i) => !i.hidden);
}

export function getNextTrustStep(
  items: TrustProgressItem[]
): TrustProgressItem | null {
  const priority: TrustItemStatus[] = ["action_needed", "under_review", "pending", "optional"];
  const listing = items.filter((i) => i.group === "listing_setup");
  const pool = listing.length > 0 ? listing : items;
  for (const status of priority) {
    const match = pool.find((i) => i.status === status);
    if (match) return match;
  }
  return null;
}

export function getNextStepMessage(
  profile: Profile,
  next: TrustProgressItem | null
): string | null {
  if (!next) return null;
  switch (next.id) {
    case "email":
      return "Verify your email to continue.";
    case "whatsapp":
      return "Verify your WhatsApp number to list on Yike.";
    case "profile_complete":
      return "Add your name, address, and date of birth.";
    case "profile_photo":
      return "Optional — helps buyers trust your profile.";
    case "company":
      return "Complete company verification.";
    case "agent_badge":
      return "Optional — apply for higher visibility when you are ready.";
    default:
      return null;
  }
}

export function trustProgressPercent(items: TrustProgressItem[]): number {
  const relevant = items.filter((i) => i.status !== "optional");
  if (relevant.length === 0) return 100;
  const done = relevant.filter((i) => i.status === "complete").length;
  return Math.round((done / relevant.length) * 100);
}

export function shouldShowTrustCenter(
  profile: Profile,
  verified: boolean
): boolean {
  const items = getTrustProgressItems(profile, verified);
  const incomplete = items.some(
    (i) => i.status === "action_needed" || i.status === "under_review"
  );
  const isLister = isAgentRole(profile.role);
  return incomplete || isLister || Boolean(profile.verification_required);
}
