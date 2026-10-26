"use client";

import { MarketplaceSellerContactCard } from "@/components/marketplace/marketplace-seller-contact-card";
import type { SellerContactCardIdentity } from "@/lib/marketplace/seller-contact-card-props";
import { cn } from "@/lib/utils";

/** Seller identity card below the location map — no duplicate Message/Call buttons. */
export function ListingDetailSellerSection({
  identity,
  className,
}: {
  identity: SellerContactCardIdentity;
  className?: string;
}) {
  return (
    <div className={cn(className)} data-testid="listing-detail-seller-section">
      <MarketplaceSellerContactCard {...identity} />
    </div>
  );
}
