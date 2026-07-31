import type { Metadata } from "next";
import { AdminModerationConsole } from "@/components/admin/admin-moderation-console";

export const metadata: Metadata = {
  title: "Content Moderation & Fraud Console | Yike Lex Admin",
  description: "Review flagged properties, vehicles, duplicate listings, and seller accounts.",
};

export default function AdminModerationConsolePage() {
  return (
    <main>
      <AdminModerationConsole />
    </main>
  );
}
