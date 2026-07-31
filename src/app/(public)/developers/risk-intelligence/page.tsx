import type { Metadata } from "next";
import { RiskIntelligenceDashboard } from "@/components/developers/risk-intelligence-dashboard";

export const metadata: Metadata = {
  title: "Fraud & Escrow Risk Intelligence Engine | Yike Developer Platform",
  description: "Real-time AI risk scoring (0-100), price/device/document anomaly detection, automated escrow freeze rules, and fraud metrics.",
};

export default function DeveloperRiskPage() {
  return (
    <main>
      <RiskIntelligenceDashboard />
    </main>
  );
}
