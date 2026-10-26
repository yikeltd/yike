"use client";

import type { Property } from "@/types/database";
import { cn } from "@/lib/utils";
import { MarketplaceSellerContactCard } from "@/components/marketplace/marketplace-seller-contact-card";
import { sellerContactCardFromListing } from "@/lib/marketplace/seller-contact-card-props";

export function AgentContactCard({
  listing,
  className,
  actionsVariant = "sidebar",
}: {
  listing: Property;
  className?: string;
  actionsVariant?: "sidebar" | "gallery-inline";
}) {
  const identity = sellerContactCardFromListing(listing, "PROPERTY");
  if (!identity) return null;

  return (
    <MarketplaceSellerContactCard
      {...identity}
      className={cn(className)}
      actionsVariant={actionsVariant}
    />
  );
}
