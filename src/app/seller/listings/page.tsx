import type { Metadata } from "next";
import { SellerListingsManager } from "@/components/seller/seller-listings-manager";

export const metadata: Metadata = {
  title: "Inventory Listings Manager | Yike Seller",
  description: "Manage published properties, vehicles, drafts, and inventory visibility.",
};

export default function SellerListingsPage() {
  return (
    <main>
      <SellerListingsManager />
    </main>
  );
}
