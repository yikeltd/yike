"use client";

import type { Profile } from "@/types/database";
import { hasBasicListingProfile } from "@/lib/profile/basic-listing-profile";
import { VerificationOptionCard } from "@/components/verification/verification-option-card";

export function ProfileVerificationCard({ profile }: { profile: Profile }) {
  const complete = hasBasicListingProfile(profile);

  return (
    <VerificationOptionCard
      title="Profile"
      status={complete ? "Complete" : "Incomplete"}
      statusVariant={complete ? "success" : "neutral"}
      actionLabel={complete ? undefined : "Complete profile"}
      href={complete ? undefined : "/agent/profile-setup"}
      disabled={complete}
    />
  );
}
