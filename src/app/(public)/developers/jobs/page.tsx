import type { Metadata } from "next";
import { JobsDashboard } from "@/components/developers/jobs-dashboard";

export const metadata: Metadata = {
  title: "Background Jobs & Event Processing Engine | Yike Developer Platform",
  description: "Asynchronous worker queue monitoring, dead-letter job inspection, exception retries, and scheduled cron management.",
};

export default function DeveloperJobsPage() {
  return (
    <main>
      <JobsDashboard />
    </main>
  );
}
