import type { Metadata } from "next";
import { HaDrDashboard } from "@/components/developers/ha-dr-dashboard";

export const metadata: Metadata = {
  title: "High Availability & Disaster Recovery Console | Yike Developer Platform",
  description: "Multi-region failover, RTO (<30s) and RPO (<1s) metrics, automated backup verification, and DR drill simulation.",
};

export default function DeveloperHaDrPage() {
  return (
    <main>
      <HaDrDashboard />
    </main>
  );
}
