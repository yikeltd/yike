import type { Metadata } from "next";
import { SellerWorkspaceExperience } from "@/components/seller/seller-workspace-experience";

export const metadata: Metadata = {
  title: "Seller Workspace & Merchant Dashboard | Yike",
  description: "Manage property & vehicle inventory, inbound leads CRM, active escrow transactions, and trust score metrics.",
};

export default function SellerWorkspacePage() {
  return (
    <main>
      <SellerWorkspaceExperience />
    </main>
  );
}
