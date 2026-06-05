import type { MarketplaceStats } from "@/lib/marketplace-stats";
import { MOCK_LISTINGS } from "@/lib/mock-listings";
import { isTrustVerified } from "@/lib/hub-filters";

/** Realistic social proof when Supabase has no live activity yet. */
export function getDemoMarketplaceStats(): MarketplaceStats {
  const weekMs = 7 * 86_400_000;
  const now = Date.now();

  const listingsThisWeek = MOCK_LISTINGS.filter((p) => {
    const age = now - new Date(p.created_at).getTime();
    return age <= weekMs;
  }).length;

  const verifiedAgentsRecently = new Set(
    MOCK_LISTINGS.filter((p) => isTrustVerified(p) && p.agent?.id)
      .slice(0, 24)
      .map((p) => p.agent!.id)
  ).size;

  const cityCounts = new Map<string, number>();
  for (const p of MOCK_LISTINGS) {
    cityCounts.set(p.city, (cityCounts.get(p.city) ?? 0) + 1);
  }
  let trendingCity: { city: string; count: number } | undefined;
  for (const [city, count] of cityCounts) {
    if (!trendingCity || count > trendingCity.count) {
      trendingCity = { city, count };
    }
  }

  return {
    listingsThisWeek: Math.max(listingsThisWeek, 18),
    verifiedAgentsRecently: Math.max(verifiedAgentsRecently, 12),
    trendingCity,
  };
}
