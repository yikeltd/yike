import type { Metadata } from "next";
import { AdminRevenueDashboard } from "@/components/admin/admin-revenue-dashboard";

export const metadata: Metadata = {
  title: "Executive Revenue & Monetization Dashboard | Yike Lex Admin",
  description: "Marketplace GMV metrics, escrow custody fees, subscription MRR, and financial exports.",
};

export default function AdminRevenueOverviewPage() {
  return (
    <main>
      <AdminRevenueDashboard />
    </main>
  );
}
