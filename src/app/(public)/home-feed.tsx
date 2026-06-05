import { PropertyFeed } from "@/components/property/property-feed";
import {
  getFeaturedProperties,
  getPublicProperties,
  getVerifiedListings,
} from "@/lib/properties";
import { withDemoFallback } from "@/lib/mock-listings";
import type { Property } from "@/types/database";

function mergeFeed(
  featured: Property[],
  verified: Property[],
  latest: Property[]
): Property[] {
  const seen = new Set<string>();
  const out: Property[] = [];
  for (const list of [featured, verified, latest]) {
    for (const p of list) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        out.push(p);
      }
    }
  }
  return out;
}

export async function HomeFeed() {
  const [featured, verified, latest] = await Promise.all([
    getFeaturedProperties(8),
    getVerifiedListings(8),
    getPublicProperties({}, 16),
  ]);

  const feed = mergeFeed(featured, verified, latest);
  const { items, isDemo } = withDemoFallback(feed);

  return (
    <PropertyFeed
      properties={items}
      isDemo={isDemo}
      showCount
      emptyMessage="New homes are added daily. List yours free on Yike."
    />
  );
}
