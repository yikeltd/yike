import { requireAgentLister } from "@/lib/auth";
import { hasBasicListingProfile } from "@/lib/profile/basic-listing-profile";
import { BasicProfileForm } from "@/components/agent/basic-profile-form";
import { redirect } from "next/navigation";

export default async function ProfileSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { profile } = await requireAgentLister("/agent/become", {
    skipProfileSetup: true,
  });
  const { next } = await searchParams;
  const nextPath = next?.startsWith("/") ? next : "/agent/listings/new";

  if (hasBasicListingProfile(profile)) {
    redirect(nextPath);
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 px-3 pt-4 pb-8">
      <div>
        <h1 className="text-xl font-bold text-navy">Your profile</h1>
        <p className="mt-1 text-sm text-muted">
          Personal details for listing — separate from the verified agent badge.
        </p>
      </div>
      <BasicProfileForm profile={profile} />
    </div>
  );
}
