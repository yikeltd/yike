import type { Metadata } from "next";
import { ChaosDashboard } from "@/components/developers/chaos-dashboard";

export const metadata: Metadata = {
  title: "Chaos Engineering & Self-Healing Console | Yike Developer Platform",
  description: "Automated fault injection audit testing zero-downtime component failover across Redis, PostgreSQL, Workers, Storage, and Regions.",
};

export default function DeveloperChaosPage() {
  return (
    <main>
      <ChaosDashboard />
    </main>
  );
}
