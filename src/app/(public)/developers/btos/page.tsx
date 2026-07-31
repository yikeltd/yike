import type { Metadata } from "next";
import { BtosDashboard } from "@/components/developers/btos-dashboard";

export const metadata: Metadata = {
  title: "BTOS Core Event Bus & Workflow Orchestrator | Yike Developer Platform",
  description: "Versioned event publishing (v1/v2), idempotent deduplication, and Saga compensation rollback control.",
};

export default function DeveloperBtosPage() {
  return (
    <main>
      <BtosDashboard />
    </main>
  );
}
