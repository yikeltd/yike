import type { SupabaseClient } from "@supabase/supabase-js";
import { getProfileSocialStats } from "@/lib/social/stats";
import { getActiveUserSubscription } from "@/lib/subscriptions/service";

export type SellerAnalyticsSummary = {
  listingViews: number;
  whatsappClicks: number;
  callClicks: number;
  saves: number;
  followers: number;
  listingLikes: number;
  leadsGenerated: number;
  hasAdvanced: boolean;
  planCode: string;
};

export async function getSellerAnalyticsSummary(
  admin: SupabaseClient,
  userId: string,
  days = 30
): Promise<SellerAnalyticsSummary> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  const [{ data: listings }, sub, socialStats, { count: leadsCount }] = await Promise.all([
    admin.from("properties").select("id").eq("agent_id", userId),
    getActiveUserSubscription(admin, userId),
    getProfileSocialStats(admin, userId),
    admin
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("agent_id", userId)
      .gte("created_at", since),
  ]);

  const listingIds = (listings ?? []).map((r) => r.id as string);
  const planCode = sub?.plan?.plan_code ?? "free";
  const hasAdvanced = sub?.plan?.features.analytics === "advanced";

  if (!listingIds.length) {
    return {
      listingViews: 0,
      whatsappClicks: 0,
      callClicks: 0,
      saves: 0,
      followers: socialStats.followersCount,
      listingLikes: socialStats.listingLikesCount,
      leadsGenerated: leadsCount ?? 0,
      hasAdvanced,
      planCode,
    };
  }

  const { data: events } = await admin
    .from("listing_analytics_events")
    .select("event_type")
    .in("listing_id", listingIds)
    .gte("created_at", since);

  const counts = {
    view: 0,
    whatsapp_click: 0,
    call_click: 0,
    save: 0,
  };

  for (const row of events ?? []) {
    const type = row.event_type as keyof typeof counts;
    if (type in counts) counts[type] += 1;
  }

  return {
    listingViews: counts.view,
    whatsappClicks: counts.whatsapp_click,
    callClicks: counts.call_click,
    saves: counts.save,
    followers: socialStats.followersCount,
    listingLikes: socialStats.listingLikesCount,
    leadsGenerated: leadsCount ?? 0,
    hasAdvanced,
    planCode,
  };
}
