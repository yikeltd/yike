import type { Metadata } from "next";
import { EscrowDashboard } from "@/components/developers/escrow-dashboard";

export const metadata: Metadata = {
  title: "Escrow Operating System | Yike Developer Platform",
  description: "Atomic double-entry financial ledger, multi-stage milestone partial release engine, and Pan-African payment adapter gateway.",
};

export default function DeveloperEscrowPage() {
  return (
    <main>
      <EscrowDashboard />
    </main>
  );
}
