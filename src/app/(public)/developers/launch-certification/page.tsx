import type { Metadata } from "next";
import { LaunchCertificationDashboard } from "@/components/developers/launch-certification-dashboard";

export const metadata: Metadata = {
  title: "Enterprise Production Launch Certification | Yike Developer Platform",
  description: "Official Digital Launch Certificate (CERT-YIKE-2026-PROD-RELEASE-V2.2) and 8-point architectural release gate verification.",
};

export default function DeveloperLaunchCertificationPage() {
  return (
    <main>
      <LaunchCertificationDashboard />
    </main>
  );
}
