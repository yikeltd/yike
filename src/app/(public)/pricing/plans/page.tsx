import type { Metadata } from "next";
import { SubscriptionPlansManager } from "@/components/pricing/subscription-plans-manager";

export const metadata: Metadata = {
  title: "Merchant Subscription Plans & Pricing | Yike",
  description: "Scale your property agency or vehicle dealership with higher listing limits, escrow fee discounts, and AI lead insights.",
};

export default function PricingPlansPage() {
  return (
    <main>
      <SubscriptionPlansManager />
    </main>
  );
}
