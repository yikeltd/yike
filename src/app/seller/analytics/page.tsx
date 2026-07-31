import type { Metadata } from "next";
import { SellerAnalyticsDashboard } from "@/components/seller/seller-analytics-dashboard";

export const metadata: Metadata = {
  title: "Seller Analytics & Performance | Yike Seller",
  description: "View inventory impressions, lead conversion rates, and trust health analytics.",
};

export default function SellerAnalyticsPage() {
  return (
    <main>
      <SellerAnalyticsDashboard />
    </main>
  );
}
