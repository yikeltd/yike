import { LegalPartnerDashboardClient } from "@/components/legal-partner/legal-partner-dashboard-client";
import { SITE_NAME } from "@/lib/constants";

export const metadata = {
  title: `Legal Partner Dashboard — ${SITE_NAME}`,
  description: "Assigned legal reviews, structured reports, and payout history.",
};

export default function LegalPartnerDashboardPage() {
  return (
    <div className="min-h-screen bg-surface/30 py-8">
      <LegalPartnerDashboardClient />
    </div>
  );
}
