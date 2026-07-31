import type { Metadata } from "next";
import { ObservabilityDashboard } from "@/components/developers/observability-dashboard";

export const metadata: Metadata = {
  title: "Platform Observability & Distributed Tracing | Yike Developer Platform",
  description: "End-to-end request trace waterfalls, correlation IDs, interactive service dependency maps, log streams, and performance percentiles.",
};

export default function DeveloperObservabilityPage() {
  return (
    <main>
      <ObservabilityDashboard />
    </main>
  );
}
