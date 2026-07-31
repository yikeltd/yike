import type { Metadata } from "next";
import { AdminAuditLogs } from "@/components/admin/admin-audit-logs";

export const metadata: Metadata = {
  title: "Immutable System Audit Logs | Yike Lex Admin",
  description: "Staff activity audit trail, verification approvals, escrow payouts, and compliance logs.",
};

export default function AdminAuditTrailConsolePage() {
  return (
    <main>
      <AdminAuditLogs />
    </main>
  );
}
