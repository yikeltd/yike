import type { Metadata } from "next";
import { AdminVerificationQueue } from "@/components/admin/admin-verification-queue";

export const metadata: Metadata = {
  title: "Merchant Verification Operations Queue | Yike Lex Admin",
  description: "Audit NIN identity registrations, CAC business status, and physical office proofs.",
};

export default function AdminVerificationOpsConsolePage() {
  return (
    <main>
      <AdminVerificationQueue />
    </main>
  );
}
