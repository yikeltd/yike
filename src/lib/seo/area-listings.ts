import type { Property } from "@/types/database";
import { isFeaturedActive, isVerifiedAgentProfile } from "@/lib/agent-tiers";
import { isRecentlyUpdated } from "@/lib/trust/quality";

export type AreaListingSections = {
  all: Property[];
  featured: Property[];
  verified: Property[];
  recentlyAdded: Property[];
};

export function partitionAreaListings(listings: Property[]): AreaListingSections {
  const featured = listings.filter(
    (p) =>
      isFeaturedActive(p) ||
      p.yike_verified ||
      p.is_verified_listing
  ).slice(0, 6);

  const verified = listings
    .filter(
      (p) =>
        p.yike_verified ||
        p.is_verified_listing ||
        (p.agent && isVerifiedAgentProfile(p.agent))
    )
    .slice(0, 8);

  const recentlyAdded = [...listings]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .filter((p) => {
      const days =
        (Date.now() - new Date(p.created_at).getTime()) / 86_400_000;
      return days <= 30 || isRecentlyUpdated(p);
    })
    .slice(0, 8);

  return { all: listings, featured, verified, recentlyAdded };
}
