import type { Metadata } from "next";
import { PartnerDashboard } from "@/components/developers/partner-dashboard";

export const metadata: Metadata = {
  title: "Enterprise Partner Management Platform | Yike Developer Platform",
  description: "Multi-discipline certified partner onboarding, license verification, geo-fence dispatching, and SLA response tracking.",
};

export default function DeveloperPartnerPage() {
  return (
    <main>
      <PartnerDashboard />
    </main>
  );
}
