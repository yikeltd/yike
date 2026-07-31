import type { Metadata } from "next";
import { DeveloperAnalyticsDashboard } from "@/components/account/developer-analytics-dashboard";

export const metadata: Metadata = {
  title: "API Consumer Analytics Dashboard | Yike Account",
  description: "Monitor API request volume, response latency, HTTP status codes, and webhook delivery performance.",
};

export default function DeveloperAnalyticsPage() {
  return (
    <main>
      <DeveloperAnalyticsDashboard />
    </main>
  );
}
