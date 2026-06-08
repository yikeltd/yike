import type { Profile } from "@/types/database";
import { isAgentRole } from "@/lib/agent-tiers";
import { getProfilePersona } from "@/lib/profile-display";
import { effectiveTrustLevel } from "./levels";
import { getRequiredVerificationTasks } from "./tasks";

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

  if (status === "pending") {
    return { label: "Under review", tone: "warning" };
  }
  if (verified || profile.verified_badge) {
    return { label: "Premium verified", tone: "premium" };
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
  const tasks = getRequiredVerificationTasks(profile);
  const items: TrustProgressItem[] = [];

  items.push({
    id: "email",
    label: "Email verified",
    status: profile.email_verified ? "complete" : "action_needed",
    href: "/auth/verify-email",
  });

  const whatsappDone = Boolean(
    profile.phone_verified || profile.whatsapp?.trim() || profile.phone?.trim()
  );
  items.push({
    id: "whatsapp",
    label: "WhatsApp connected",
    status: whatsappDone ? "complete" : "action_needed",
    href: "/agent",
  });

  items.push({
    id: "profile_photo",
    label: "Profile photo",
    status: profile.avatar_url ? "complete" : isLister ? "action_needed" : "optional",
    href: "/agent",
  });

  if (isLister) {
    const bankTask = tasks.find((t) => t.id === "bank");
    if (bankTask) {
      items.push({
        id: "bank",
        label: "Bank verification",
        status: profile.bank_verified ? "complete" : "action_needed",
        href: "/agent/verification",
      });
    }

    if (persona === "company") {
      items.push({
        id: "company",
        label: "Company verification",
        status: profile.company_verified ? "complete" : "action_needed",
        href: "/agent/company",
      });
    }

    if (verified) {
      items.push({
        id: "agent_badge",
        label: "Verified agent badge",
        status: "complete",
        href: "/agent/verification",
      });
    } else if (profile.verification_status === "pending") {
      items.push({
        id: "agent_badge",
        label: "Verified agent badge",
        status: "under_review",
        href: "/agent/verification",
      });
    } else if (profile.verification_status !== "not_started") {
      items.push({
        id: "agent_badge",
        label: "Verified agent badge",
        status: "optional",
        href: "/agent/verification",
      });
    }
  }

  return items.filter((i) => !i.hidden);
}

export function getNextTrustStep(
  items: TrustProgressItem[]
): TrustProgressItem | null {
  const priority: TrustItemStatus[] = ["action_needed", "under_review", "pending", "optional"];
  for (const status of priority) {
    const match = items.find((i) => i.status === status);
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
      return "Add WhatsApp so buyers can reach you.";
    case "profile_photo":
      return "Add a profile photo.";
    case "bank":
      return "Add bank details to unlock payouts.";
    case "company":
      return "Complete company verification.";
    case "agent_badge":
      if (next.status === "under_review") {
        return "Badge application under review.";
      }
      return "Apply for verified badge for higher visibility.";
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
