import { getSession, getProfile, isEmailVerified } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BecomeAgentCard } from "@/components/agent/become-agent-card";
import { canListProperties } from "@/lib/agent-tiers";
import { hasBasicListingProfile } from "@/lib/profile/basic-listing-profile";

export default async function BecomeAgentPage() {
  const user = await getSession();
  if (!user) {
    redirect("/auth/login?next=/agent/become");
  }

  const profile = await getProfile(user.id);
  if (!profile || profile.is_banned) {
    redirect("/");
  }

  if (canListProperties(profile)) {
    if (!hasBasicListingProfile(profile)) {
      redirect("/agent/profile-setup?next=/agent/listings/new");
    }
    redirect("/agent/listings/new");
  }

  return (
    <div className="mx-auto max-w-lg px-3 pt-4 pb-8">
      <BecomeAgentCard
        profile={profile}
        phoneVerified={profile.phone_verified}
        emailVerified={isEmailVerified(user, profile)}
      />
    </div>
  );
}
