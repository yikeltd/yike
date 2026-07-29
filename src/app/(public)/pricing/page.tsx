import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { SellerPlansView } from "@/components/subscriptions/seller-plans-view";

export const metadata: Metadata = {
  title: `Seller Plans | ${SITE_NAME}`,
  description: `Simple, transparent seller plans for vehicle dealers, property agents, and enterprise listers on ${SITE_NAME}.`,
  alternates: { canonical: `${SITE_URL}/pricing` },
};

export default function PricingPage() {
  return <SellerPlansView />;
}
