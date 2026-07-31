import type { Metadata } from "next";
import { LoadTestingDashboard } from "@/components/developers/load-testing-dashboard";

export const metadata: Metadata = {
  title: "Load Testing Center & Stress Simulator | Yike Developer Platform",
  description: "Documented performance benchmarks from 10 to 100,000 concurrent users with sub-100ms P95 latency guarantees.",
};

export default function DeveloperLoadTestingPage() {
  return (
    <main>
      <LoadTestingDashboard />
    </main>
  );
}
