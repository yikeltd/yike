import type { Metadata } from "next";
import { AdminSupportConsole } from "@/components/admin/admin-support-console";

export const metadata: Metadata = {
  title: "Customer Support Operations Desk | Yike Lex Support",
  description: "Manage customer support tickets, account lookups, and dispute inquiries.",
};

export default function AdminSupportConsolePage() {
  return (
    <main>
      <AdminSupportConsole />
    </main>
  );
}
