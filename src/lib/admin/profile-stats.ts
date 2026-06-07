import type { SupabaseClient } from "@supabase/supabase-js";
import { countAsActiveListing } from "@/lib/agent-tiers";

export type AdminProfileStats = {
  active_listing_count: number;
  total_listings: number;
  leads: number;
  reviews: number;
  reports: number;
  unresolved_reports: number;
  rejected_listings: number;
};

export async function fetchAdminProfileStats(
  supabase: SupabaseClient,
  userId: string
): Promise<AdminProfileStats> {
  const { data: listings } = await supabase
    .from("properties")
    .select("id, status, expires_at")
    .eq("agent_id", userId);

  const listingRows = listings ?? [];
  const listingIds = listingRows.map((p) => p.id);

  const activeListingCount = listingRows.filter((p) =>
    countAsActiveListing(p.status, p.expires_at)
  ).length;

  const rejectedListings = listingRows.filter((p) => p.status === "rejected").length;

  const [{ count: leadCount }, { count: reviewCount }] = await Promise.all([
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("agent_id", userId),
    supabase
      .from("agent_reviews")
      .select("id", { count: "exact", head: true })
      .or(`agent_id.eq.${userId},company_id.eq.${userId}`),
  ]);

  let reportCount = 0;
  let unresolvedReports = 0;

  if (listingIds.length > 0) {
    const [{ count: totalReports }, { count: openReports }] = await Promise.all([
      supabase
        .from("listing_reports")
        .select("id", { count: "exact", head: true })
        .in("property_id", listingIds),
      supabase
        .from("listing_reports")
        .select("id", { count: "exact", head: true })
        .in("property_id", listingIds)
        .eq("status", "open"),
    ]);
    reportCount = totalReports ?? 0;
    unresolvedReports = openReports ?? 0;
  }

  return {
    active_listing_count: activeListingCount,
    total_listings: listingRows.length,
    leads: leadCount ?? 0,
    reviews: reviewCount ?? 0,
    reports: reportCount,
    unresolved_reports: unresolvedReports,
    rejected_listings: rejectedListings,
  };
}
