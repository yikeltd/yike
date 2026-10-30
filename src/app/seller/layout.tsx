import { ConsumerMarketplaceShell } from "@/components/layout/consumer-marketplace-shell";

/** Seller workspace routes share marketplace chrome (launch-hidden surfaces). */
export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return <ConsumerMarketplaceShell>{children}</ConsumerMarketplaceShell>;
}
