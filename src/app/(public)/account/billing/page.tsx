import type { Metadata } from "next";
import { BillingHistoryCenter } from "@/components/account/billing-history-center";

export const metadata: Metadata = {
  title: "Billing & Invoices | Yike Account",
  description: "View merchant subscription history, downloadable receipts, and tax invoices (7.5% VAT).",
};

export default function AccountBillingPage() {
  return (
    <main>
      <BillingHistoryCenter />
    </main>
  );
}
