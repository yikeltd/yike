import { VerifierDashboardClient } from "@/components/verifier/verifier-dashboard-client";
import { SITE_NAME } from "@/lib/constants";

export const metadata = {
  title: `Verifier Dashboard — ${SITE_NAME}`,
  description: "Field assignments, inspection reports, and payout history.",
};

export default function VerifierDashboardPage() {
  return (
    <div className="min-h-screen bg-surface/30 py-8">
      <VerifierDashboardClient />
    </div>
  );
}
