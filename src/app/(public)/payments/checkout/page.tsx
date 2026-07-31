import type { Metadata } from "next";
import { UnifiedCheckoutExperience } from "@/components/commerce/unified-checkout-experience";

export const metadata: Metadata = {
  title: "Secure Payment Checkout | Yike",
  description: "Unified checkout for listing boosts, verification packages, subscription plans, and escrow deposits.",
};

export default function CheckoutPage() {
  return (
    <main>
      <UnifiedCheckoutExperience />
    </main>
  );
}
