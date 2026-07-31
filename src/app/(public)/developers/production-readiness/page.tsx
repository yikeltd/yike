import type { Metadata } from "next";
import { ProductionReadinessDashboard } from "@/components/developers/production-readiness-dashboard";

export const metadata: Metadata = {
  title: "Production Readiness Single Pane of Glass Scorecard | Yike Developer Platform",
  description: "Executive consolidation across Live Monitoring, Load Testing, Security Center, Chaos Engineering, Backup Validation, and API Governance.",
};

export default function DeveloperProductionReadinessPage() {
  return (
    <main>
      <ProductionReadinessDashboard />
    </main>
  );
}
