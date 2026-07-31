import type { Metadata } from "next";
import { SellerTransactionsQueue } from "@/components/seller/seller-transactions-queue";

export const metadata: Metadata = {
  title: "Merchant Escrow Queue | Yike Seller",
  description: "Live buyer escrow deals, milestone tracking, and payout settlement queue.",
};

export default function SellerTransactionsPage() {
  return (
    <main>
      <SellerTransactionsQueue />
    </main>
  );
}
