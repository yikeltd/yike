import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getDemoMarketplaceStats } from "@/lib/demo-marketplace-stats";
import { isProductionEnv } from "@/lib/env";

export type MarketplaceStats = {
  listingsThisWeek: number;
  verifiedAgentsRecently: number;
  trendingCity?: { city: string; count: number };
};

export async function getMarketplaceStats(): Promise<MarketplaceStats | null> {
  if (!isSupabaseConfigured()) {
    return isProductionEnv() ? null : getDemoMarketplaceStats();
  }

  const supabase = await createClient();
  if (!supabase) return null;

  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();

  const [listingsRes, agentsRes, citiesRes] = await Promise.all([
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved")
      .gte("created_at", weekAgo),
    supabase
      .from("agent_verifications")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved")
      .gte("reviewed_at", weekAgo),
    supabase
      .from("properties")
      .select("city")
      .eq("status", "approved")
      .gte("created_at", weekAgo)
      .limit(200),
  ]);

  const listingsThisWeek = listingsRes.count ?? 0;
  const verifiedAgentsRecently = agentsRes.count ?? 0;

  const cityCounts = new Map<string, number>();
  for (const row of citiesRes.data ?? []) {
    const c = row.city as string;
    cityCounts.set(c, (cityCounts.get(c) ?? 0) + 1);
  }
  let trendingCity: { city: string; count: number } | undefined;
  for (const [city, count] of cityCounts) {
    if (!trendingCity || count > trendingCity.count) {
      trendingCity = { city, count };
    }
  }

  if (listingsThisWeek === 0 && verifiedAgentsRecently === 0 && !trendingCity) {
    return isProductionEnv() ? null : getDemoMarketplaceStats();
  }

  return {
    listingsThisWeek,
    verifiedAgentsRecently,
    trendingCity: trendingCity && trendingCity.count >= 3 ? trendingCity : undefined,
  };
}
