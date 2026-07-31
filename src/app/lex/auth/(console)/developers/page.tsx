import type { Metadata } from "next";
import { AdminDeveloperGovernance } from "@/components/admin/admin-developer-governance";

export const metadata: Metadata = {
  title: "Developer Platform & Partner Governance | Yike Lex Admin",
  description: "Monitor API throughput, webhook delivery rates, partner credentials, and rate limit audit logs.",
};

export default function AdminDeveloperGovernancePage() {
  return (
    <main>
      <AdminDeveloperGovernance />
    </main>
  );
}
