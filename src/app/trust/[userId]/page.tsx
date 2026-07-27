import { getOrCreateTrustIdentity } from "@/lib/identity/service";
import { TrustProfileClient } from "./trust-profile-client";

export const metadata = {
  title: "Yike Passport & Trust Identity | Yike",
  description: "Verified identity credentials, trust score audit, reputation metrics, and badges.",
};

export default async function TrustProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const passport = await getOrCreateTrustIdentity(userId);

  return (
    <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8">
      <TrustProfileClient passport={passport} />
    </div>
  );
}
