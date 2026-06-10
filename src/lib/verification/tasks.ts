import { isAgentRole } from "@/lib/agent-tiers";
import { isPhoneOtpEnabled } from "@/lib/feature-flags";
import { hasBasicListingProfile } from "@/lib/profile/basic-listing-profile";
import type { VerificationControlConfig } from "./config";
import { effectiveTrustLevel, type TrustProfileSlice } from "./levels";

export type VerificationTaskId =
  | "email"
  | "whatsapp"
  | "profile_complete"
  | "profile_photo"
  | "bank"
  | "company"
  | "cac"
  | "admin_review"
  | "support_contact";

export type VerificationTask = {
  id: VerificationTaskId;
  label: string;
  complete: boolean;
  required: boolean;
};

export function getRequiredVerificationTasks(
  profile: Partial<TrustProfileSlice> & Pick<TrustProfileSlice, "role" | "is_banned">,
  config?: Partial<VerificationControlConfig>,
  escalationActions: string[] = []
): VerificationTask[] {
  const level = effectiveTrustLevel(profile);
  const escalated = profile.verification_required || level >= 4;
  const tasks: VerificationTask[] = [];

  const isLister = isAgentRole(profile.role);
  const needsEmail = config?.email_verification_required !== false;
  const needsWhatsApp =
    isPhoneOtpEnabled() && config?.whatsapp_verification_required === true;
  const needsBank =
    config?.bank_verification_required ||
    escalationActions.includes("require_bank_verification");
  const needsCompany = config?.company_verification_required;
  const needsCac = config?.cac_verification_required;

  if (needsEmail) {
    tasks.push({
      id: "email",
      label: "Verify your email",
      complete: Boolean(profile.email_verified),
      required: true,
    });
  }

  if (needsWhatsApp || escalationActions.includes("require_whatsapp_review")) {
    tasks.push({
      id: "whatsapp",
      label: "Verify WhatsApp contact",
      complete: Boolean(
        profile.phone_verified ||
          profile.whatsapp?.trim() ||
          profile.phone?.trim()
      ),
      required: true,
    });
  }

  tasks.push({
    id: "profile_complete",
    label: "Complete your basic profile",
    complete: hasBasicListingProfile(profile),
    required:
      escalated || (isLister && !hasBasicListingProfile(profile)),
  });

  tasks.push({
    id: "profile_photo",
    label: "Add a profile photo (optional)",
    complete: Boolean(profile.avatar_url),
    required: level >= 4,
  });

  if (needsBank) {
    tasks.push({
      id: "bank",
      label: "Add bank details for verification",
      complete: Boolean(profile.bank_verified),
      required: true,
    });
  }

  if (needsCompany) {
    tasks.push({
      id: "company",
      label: "Complete company verification",
      complete: Boolean(profile.company_verified),
      required: level >= 3,
    });
  }

  if (needsCac) {
    tasks.push({
      id: "cac",
      label: "Submit CAC documentation",
      complete: Boolean(profile.cac_number),
      required: level >= 3,
    });
  }

  if (escalated) {
    tasks.push({
      id: "admin_review",
      label: "Yike trust review",
      complete: false,
      required: true,
    });
  }

  if (level >= 5) {
    tasks.push({
      id: "support_contact",
      label: "Contact Yike support if you need help",
      complete: false,
      required: false,
    });
  }

  return tasks;
}

export function serializeRequiredTasks(tasks: VerificationTask[]): string[] {
  return tasks.filter((t) => t.required && !t.complete).map((t) => t.id);
}
