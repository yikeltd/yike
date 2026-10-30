"use client";

import { MarketplaceSellerContactCard } from "@/components/marketplace/marketplace-seller-contact-card";
import type { SellerContactCardIdentity } from "@/lib/marketplace/seller-contact-card-props";
import { cn } from "@/lib/utils";

/** Full seller profile + reviews below the location map — no Message/Call CTAs. */
export function ListingDetailSellerSection({
  identity,
  className,
}: {
  identity: SellerContactCardIdentity;
  className?: string;
}) {
  return (
    <section
      className={cn(className)}
      data-testid="listing-detail-seller-section"
      aria-label="Seller profile"
    >
      <MarketplaceSellerContactCard {...identity} variant="listingDetail" />
    </section>
  );
}
