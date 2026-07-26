"use client";

import {
  VerifiedBadge,
  FeaturedBadge,
  YikeVerifiedBadge,
  PremiumBadge,
  NegotiableBadge,
  SoldBadge,
  NewListingBadge,
  TrendingBadge,
} from "@/components/ui/badge";
import type { ListingBadgeKind } from "@/lib/design/listing-badges";

export function ListingBadgeRow({
  badges,
  size = "sm",
  className,
}: {
  badges: ListingBadgeKind[];
  size?: "sm" | "md";
  className?: string;
}) {
  if (badges.length === 0) return null;

  return (
    <div className={className ?? "flex flex-wrap items-center gap-1.5"}>
      {badges.map((kind) => {
        switch (kind) {
          case "verified":
            return <VerifiedBadge key={kind} size={size} />;
          case "yike_verified":
            return <YikeVerifiedBadge key={kind} size={size} />;
          case "featured":
            return <FeaturedBadge key={kind} />;
          case "trending":
            return <TrendingBadge key={kind} />;
          case "premium":
            return <PremiumBadge key={kind} size={size} />;
          case "new":
            return <NewListingBadge key={kind} />;
          case "negotiable":
            return <NegotiableBadge key={kind} size={size} />;
          case "sold":
            return <SoldBadge key={kind} size={size} label="Sold" />;
          case "rented":
            return <SoldBadge key={kind} size={size} label="Rented" />;
          default:
            return null;
        }
      })}
    </div>
  );
}
