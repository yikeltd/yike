import type { Metadata } from "next";
import { AdminDeveloperAnalytics } from "@/components/admin/admin-developer-analytics";

export const metadata: Metadata = {
  title: "Staff Developer Platform Analytics | Yike Lex Admin",
  description: "Monitor platform-wide API request volume, top merchant consumers, version adoption, and error logs.",
};

export default function AdminDeveloperAnalyticsPage() {
  return (
    <main>
      <AdminDeveloperAnalytics />
    </main>
  );
}
