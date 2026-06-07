import { AmbassadorDashboardClient } from "@/components/ambassador/ambassador-dashboard-client";
import { SITE_NAME } from "@/lib/constants";

export const metadata = {
  title: `Ambassador Dashboard — ${SITE_NAME}`,
  description: "Track onboardings, earnings, and referral tools.",
};

export default function AmbassadorDashboardPage() {
  return (
    <div className="min-h-screen bg-surface/30 py-8">
      <AmbassadorDashboardClient />
    </div>
  );
}
