import type { Metadata } from "next";
import { DeveloperPortalExperience } from "@/components/developers/developer-portal-experience";

export const metadata: Metadata = {
  title: "Yike Developer Platform & API Docs | Yike v2.0",
  description: "Integrate listings, trust passports, escrow transaction webhooks, and AI lead scoring directly into your software stack.",
};

export default function DeveloperPortalPage() {
  return (
    <main>
      <DeveloperPortalExperience />
    </main>
  );
}
