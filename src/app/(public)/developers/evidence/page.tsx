import type { Metadata } from "next";
import { EvidenceDashboard } from "@/components/developers/evidence-dashboard";

export const metadata: Metadata = {
  title: "Evidence Vault & Cryptographic Verification | Yike Developer Platform",
  description: "Tamper-proof evidence repository with dual SHA-256 hashing, EXIF metadata validation, and court-ready legal bundle compiler.",
};

export default function DeveloperEvidencePage() {
  return (
    <main>
      <EvidenceDashboard />
    </main>
  );
}
