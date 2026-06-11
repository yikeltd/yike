import type { SupabaseClient } from "@supabase/supabase-js";
import type { LeadSource } from "@/lib/listing-leads/constants";

export type ListingLeadAnalytics = {
  total: number;
  thisMonth: number;
  thisWeek: number;
  conversionRate: number;
  bestListing: { id: string; title: string; count: number } | null;
  bySource: Partial<Record<LeadSource, number>>;
  byType: Record<string, number>;
};

export async function getListingLeadAnalytics(
  admin: SupabaseClient,
  sellerId: string
): Promise<ListingLeadAnalytics> {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(Date.now() - 7 * 86_400_000);

  const { data: rows } = await admin
    .from("listing_leads")
    .select("id, lead_type, lead_source, status, listing_id, created_at, metadata")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false })
    .limit(5000);

  const all = rows ?? [];
  const thisMonth = all.filter((r) => new Date(r.created_at as string) >= monthStart);
  const thisWeek = all.filter((r) => new Date(r.created_at as string) >= weekStart);

  const closed = all.filter((r) => r.status === "closed" || r.status === "qualified").length;
  const conversionRate =
    all.length > 0 ? Math.round((closed / all.length) * 1000) / 10 : 0;

  const listingCounts = new Map<string, number>();
  for (const row of all) {
    const lid = row.listing_id as string | null;
    if (!lid) continue;
    listingCounts.set(lid, (listingCounts.get(lid) ?? 0) + 1);
  }

  let bestListing: ListingLeadAnalytics["bestListing"] = null;
  if (listingCounts.size > 0) {
    const [id, count] = [...listingCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    const sample = all.find((r) => r.listing_id === id);
    const meta = (sample?.metadata ?? {}) as { listing_title?: string };
    const { data: prop } = await admin
      .from("properties")
      .select("title")
      .eq("id", id)
      .maybeSingle();
    bestListing = {
      id,
      count,
      title: prop?.title ?? meta.listing_title ?? "Listing",
    };
  }

  const bySource: Partial<Record<LeadSource, number>> = {};
  const byType: Record<string, number> = {};
  for (const row of all) {
    const src = (row.lead_source as LeadSource) ?? "other";
    bySource[src] = (bySource[src] ?? 0) + 1;
    const t = row.lead_type as string;
    byType[t] = (byType[t] ?? 0) + 1;
  }

  return {
    total: all.length,
    thisMonth: thisMonth.length,
    thisWeek: thisWeek.length,
    conversionRate,
    bestListing,
    bySource,
    byType,
  };
}
