import type { Metadata } from "next";
import { ApiHealthDashboard } from "@/components/developers/api-health-dashboard";

export const metadata: Metadata = {
  title: "API Operational Health & Status Dashboard | Yike Developer Platform",
  description: "Real-time API service availability, response latency benchmarks, 90-day uptime metrics, and scheduled maintenance notices.",
};

export default function DeveloperHealthPage() {
  return (
    <main>
      <ApiHealthDashboard />
    </main>
  );
}
