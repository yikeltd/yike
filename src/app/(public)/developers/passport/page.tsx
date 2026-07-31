import type { Metadata } from "next";
import { PassportDashboard } from "@/components/developers/passport-dashboard";

export const metadata: Metadata = {
  title: "Transaction Passport Explorer | Yike Developer Platform",
  description: "Canonical state machine execution and asset-agnostic transaction passport control center.",
};

export default function DeveloperPassportPage() {
  return (
    <main>
      <PassportDashboard />
    </main>
  );
}
