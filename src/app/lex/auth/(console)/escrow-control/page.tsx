import type { Metadata } from "next";
import { AdminEscrowControl } from "@/components/admin/admin-escrow-control";

export const metadata: Metadata = {
  title: "Escrow Officer Control Hub | Yike Lex Admin",
  description: "Monitor live transactions, authorize milestone payouts, and manage dispute freezes.",
};

export default function AdminEscrowControlConsolePage() {
  return (
    <main>
      <AdminEscrowControl />
    </main>
  );
}
