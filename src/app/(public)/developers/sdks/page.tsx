import type { Metadata } from "next";
import { SdkExpansionExperience } from "@/components/developers/sdk-expansion-experience";

export const metadata: Metadata = {
  title: "Official Developer SDK Reference Hub | Yike Developer Platform",
  description: "Official SDK libraries for TypeScript/Node.js, Python, PHP/Laravel, Go, and Java ecosystems.",
};

export default function DeveloperSdksPage() {
  return (
    <main>
      <SdkExpansionExperience />
    </main>
  );
}
