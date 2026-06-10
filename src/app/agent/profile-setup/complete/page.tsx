import Link from "next/link";
import { requireAgentLister } from "@/lib/auth";
import { hasBasicListingProfile } from "@/lib/profile/basic-listing-profile";
import { redirect } from "next/navigation";

export default async function ProfileSetupCompletePage() {
  const { profile } = await requireAgentLister("/agent/become", {
    skipProfileSetup: true,
  });

  if (!hasBasicListingProfile(profile)) {
    redirect("/agent/profile-setup");
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-3 pt-12 pb-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/20 text-2xl text-navy">
        ✓
      </div>
      <h1 className="mt-4 text-xl font-bold text-navy">
        Thank you. Your profile is ready.
      </h1>
      <Link
        href="/agent/listings/new"
        className="mt-8 flex h-12 w-full max-w-sm items-center justify-center rounded-xl bg-gold text-sm font-semibold text-navy shadow-sm pressable"
      >
        List your first property
      </Link>
    </div>
  );
}
