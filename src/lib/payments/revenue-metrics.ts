import type { SupabaseClient } from "@supabase/supabase-js";

export type RevenueOverviewMetrics = {
  todayRevenue: number;
  revenue7d: number;
  revenue30d: number;
  featuredListingsSold: number;
  boostRevenue: number;
  boostOrders: number;
  activeBoosts: number;
  expiredBoosts: number;
  pendingPayments: number;
  successfulPayments: number;
  failedPayments: number;
};

function startOfDayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

async function sumSuccessfulRevenue(
  admin: SupabaseClient,
  sinceIso: string,
  orderType?: string
): Promise<number> {
  let query = admin
    .from("payment_orders")
    .select("amount")
    .eq("status", "successful")
    .gte("paid_at", sinceIso);

  if (orderType) query = query.eq("order_type", orderType);

  const { data } = await query;
  return (data ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
}

async function countByStatus(
  admin: SupabaseClient,
  status: string,
  orderType?: string
): Promise<number> {
  let query = admin
    .from("payment_orders")
    .select("id", { count: "exact", head: true })
    .eq("status", status);

  if (orderType) query = query.eq("order_type", orderType);

  const { count } = await query;
  return count ?? 0;
}

async function countPromotions(
  admin: SupabaseClient,
  promotionType: "boost",
  status: string
): Promise<number> {
  const { count } = await admin
    .from("listing_promotions")
    .select("id", { count: "exact", head: true })
    .eq("promotion_type", promotionType)
    .eq("status", status);

  return count ?? 0;
}

export async function getRevenueOverviewMetrics(
  admin: SupabaseClient
): Promise<RevenueOverviewMetrics> {
  const todayStart = startOfDayIso();
  const d7 = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const d30 = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const [
    todayRevenue,
    revenue7d,
    revenue30d,
    featuredListingsSold,
    boostRevenue30d,
    boostOrders,
    activeBoosts,
    expiredBoosts,
    pendingCount,
    processingCount,
    successfulPayments,
    failedPayments,
  ] = await Promise.all([
    sumSuccessfulRevenue(admin, todayStart),
    sumSuccessfulRevenue(admin, d7),
    sumSuccessfulRevenue(admin, d30),
    countByStatus(admin, "successful", "featured_listing"),
    sumSuccessfulRevenue(admin, d30, "boost_listing"),
    countByStatus(admin, "successful", "boost_listing"),
    countPromotions(admin, "boost", "active"),
    countPromotions(admin, "boost", "expired"),
    countByStatus(admin, "pending"),
    countByStatus(admin, "processing"),
    countByStatus(admin, "successful"),
    countByStatus(admin, "failed"),
  ]);

  return {
    todayRevenue,
    revenue7d,
    revenue30d,
    featuredListingsSold,
    boostRevenue: boostRevenue30d,
    boostOrders,
    activeBoosts,
    expiredBoosts,
    pendingPayments: pendingCount + processingCount,
    successfulPayments,
    failedPayments,
  };
}
