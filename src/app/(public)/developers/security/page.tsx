import type { Metadata } from "next";
import { SecurityDashboard } from "@/components/developers/security-dashboard";

export const metadata: Metadata = {
  title: "Enterprise Security Center & Vulnerability Auditor | Yike Developer Platform",
  description: "OWASP Top 10 automated security checks, Supabase RLS policy auditing, secret rotation schedules, and security score.",
};

export default function DeveloperSecurityPage() {
  return (
    <main>
      <SecurityDashboard />
    </main>
  );
}
