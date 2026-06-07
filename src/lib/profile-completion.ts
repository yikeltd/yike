import type { Profile } from "@/types/database";

export function computeProfileCompletionScore(profile: Profile): number {
  const signals = [
    Boolean(profile.avatar_url),
    Boolean(profile.full_name?.trim()),
    Boolean(profile.phone || profile.whatsapp),
    profile.phone_verified,
    profile.email_verified,
    profile.verification_status === "approved",
    Boolean(profile.company_bio?.trim()),
    Boolean(profile.company_name?.trim()),
    Boolean(profile.office_address?.trim()),
  ];
  const done = signals.filter(Boolean).length;
  return Math.round((done / signals.length) * 100);
}
