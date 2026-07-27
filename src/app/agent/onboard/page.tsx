import { getSession, getProfile, isEmailVerified } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DealerOnboardWizard } from "@/components/agent/dealer-onboard-wizard";

export const metadata = {
  title: "Dealer Onboarding | Yike",
  description: "Join Yike as a dealership, agency, or professional seller.",
};

export default async function DealerOnboardPage() {
  const user = await getSession();
  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent("/agent/onboard")}`);
  }

  const profile = await getProfile(user.id);
  if (!profile || profile.is_banned) {
    redirect("/");
  }

  if (!isEmailVerified(user, profile)) {
    redirect(`/auth/verify-email?next=${encodeURIComponent("/agent/onboard")}`);
  }

  return (
    <main className="min-h-[70dvh] bg-[#f7f8fb]">
      <DealerOnboardWizard profile={profile} />
    </main>
  );
}
