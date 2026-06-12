import type { SupabaseClient } from "@supabase/supabase-js";
import { getPropertyCategoryLabel } from "@/constants/propertyCategories";
import type { PaymentOrderType } from "@/types/database";

export type RevenueStreamMetrics = {
  countToday: number;
  countMonth: number;
  amountToday: number;
  amountMonth: number;
};

export type RankedCount = {
  key: string;
  label: string;
  count: number;
};

export type CeoDashboardMetrics = {
  generatedAt: string;
  supply: {
    listingsToday: number;
    listingsThisMonth: number;
  };
  users: {
    newToday: number;
    newThisMonth: number;
  };
  revenue: {
    featured: RevenueStreamMetrics;
    boost: RevenueStreamMetrics;
    verification: RevenueStreamMetrics;
    subscription: RevenueStreamMetrics;
    ads: RevenueStreamMetrics;
    totalToday: number;
    totalMonth: number;
  };
  topCities: RankedCount[];
  topCategories: RankedCount[];
  conversion: {
    viewToInquiryRate: number;
    whatsappFunnelRate: number;
    listingApprovalRate: number;
    paymentSuccessRate: number;
    agentSignupShare: number;
  };
};

const CONSUMER_ROLES = ["user", "agent_unverified", "agent_verified", "agent"] as const;

function startOfDayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfMonthIso(): string {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function aggregateCounts(
  rows: Array<{ key: string | null }>,
  labelFor: (key: string) => string,
  limit = 8
): RankedCount[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = row.key?.trim();
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => ({ key, label: labelFor(key), count }));
}

async function countProfilesSince(
  admin: SupabaseClient,
  sinceIso: string,
  roles?: readonly string[]
): Promise<number> {
  let query = admin
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", sinceIso);
  if (roles?.length) query = query.in("role", [...roles]);
  const { count } = await query;
  return count ?? 0;
}

async function countPropertiesSince(
  admin: SupabaseClient,
  sinceIso: string,
  status?: string
): Promise<number> {
  let query = admin
    .from("properties")
    .select("*", { count: "exact", head: true })
    .gte("created_at", sinceIso);
  if (status) query = query.eq("status", status);
  const { count } = await query;
  return count ?? 0;
}

async function countPaymentsSince(
  admin: SupabaseClient,
  sinceIso: string,
  status: string
): Promise<number> {
  const { count } = await admin
    .from("payment_orders")
    .select("*", { count: "exact", head: true })
    .gte("created_at", sinceIso)
    .eq("status", status);
  return count ?? 0;
}

async function countFunnelSince(
  admin: SupabaseClient,
  sinceIso: string,
  eventType: string
): Promise<number> {
  const { count } = await admin
    .from("funnel_events")
    .select("*", { count: "exact", head: true })
    .gte("created_at", sinceIso)
    .eq("event_type", eventType);
  return count ?? 0;
}

async function getPaymentStreamMetrics(
  admin: SupabaseClient,
  orderTypes: PaymentOrderType[],
  todayStart: string,
  monthStart: string
): Promise<RevenueStreamMetrics> {
  const { data } = await admin
    .from("payment_orders")
    .select("amount, paid_at")
    .eq("status", "successful")
    .in("order_type", orderTypes)
    .gte("paid_at", monthStart)
    .not("paid_at", "is", null);

  const rows = data ?? [];
  const todayRows = rows.filter((r) => r.paid_at! >= todayStart);
  const sum = (items: typeof rows) =>
    items.reduce((total, row) => total + Number(row.amount ?? 0), 0);

  return {
    countToday: todayRows.length,
    countMonth: rows.length,
    amountToday: sum(todayRows),
    amountMonth: sum(rows),
  };
}

async function sumAllRevenue(
  admin: SupabaseClient,
  todayStart: string,
  monthStart: string
): Promise<{ today: number; month: number }> {
  const { data } = await admin
    .from("payment_orders")
    .select("amount, paid_at")
    .eq("status", "successful")
    .gte("paid_at", monthStart)
    .not("paid_at", "is", null);

  const rows = data ?? [];
  const todayRows = rows.filter((r) => r.paid_at! >= todayStart);
  const sum = (items: typeof rows) =>
    items.reduce((total, row) => total + Number(row.amount ?? 0), 0);

  return { today: sum(todayRows), month: sum(rows) };
}

export async function getCeoDashboardMetrics(
  admin: SupabaseClient
): Promise<CeoDashboardMetrics> {
  const todayStart = startOfDayIso();
  const monthStart = startOfMonthIso();
  const d30 = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const [
    listingsToday,
    listingsThisMonth,
    newUsersToday,
    newUsersThisMonth,
    newAgentsThisMonth,
    featured,
    boost,
    verification,
    subscription,
    ads,
    totals,
    approvedThisMonth,
    submittedThisMonth,
    paymentSuccessfulMonth,
    paymentFailedMonth,
    funnelClicks,
    funnelLeads,
    cityRows,
    categoryRows,
    engagementRows,
  ] = await Promise.all([
    countPropertiesSince(admin, todayStart),
    countPropertiesSince(admin, monthStart),
    countProfilesSince(admin, todayStart, CONSUMER_ROLES),
    countProfilesSince(admin, monthStart, CONSUMER_ROLES),
    countProfilesSince(admin, monthStart, [
      "agent_unverified",
      "agent_verified",
      "agent",
    ]),
    getPaymentStreamMetrics(admin, ["featured_listing"], todayStart, monthStart),
    getPaymentStreamMetrics(admin, ["boost_listing"], todayStart, monthStart),
    getPaymentStreamMetrics(
      admin,
      ["property_verification", "verification_fee"],
      todayStart,
      monthStart
    ),
    getPaymentStreamMetrics(admin, ["subscription"], todayStart, monthStart),
    getPaymentStreamMetrics(admin, ["advertisement"], todayStart, monthStart),
    sumAllRevenue(admin, todayStart, monthStart),
    countPropertiesSince(admin, monthStart, "approved"),
    countPropertiesSince(admin, monthStart),
    countPaymentsSince(admin, monthStart, "successful"),
    countPaymentsSince(admin, monthStart, "failed"),
    countFunnelSince(admin, d30, "whatsapp_button_clicked"),
    countFunnelSince(admin, d30, "lead_created"),
    admin
      .from("properties")
      .select("city")
      .eq("status", "approved")
      .not("city", "is", null)
      .limit(5000),
    admin
      .from("properties")
      .select("property_type")
      .eq("status", "approved")
      .not("property_type", "is", null)
      .limit(5000),
    admin.from("properties").select("views_count, contact_clicks").eq("status", "approved"),
  ]);

  const engagement = engagementRows.data ?? [];
  const totalViews = engagement.reduce((sum, row) => sum + (row.views_count ?? 0), 0);
  const totalClicks = engagement.reduce((sum, row) => sum + (row.contact_clicks ?? 0), 0);

  return {
    generatedAt: new Date().toISOString(),
    supply: {
      listingsToday,
      listingsThisMonth,
    },
    users: {
      newToday: newUsersToday,
      newThisMonth: newUsersThisMonth,
    },
    revenue: {
      featured,
      boost,
      verification,
      subscription,
      ads,
      totalToday: totals.today,
      totalMonth: totals.month,
    },
    topCities: aggregateCounts(
      (cityRows.data ?? []).map((r) => ({ key: r.city as string })),
      (key) => key
    ),
    topCategories: aggregateCounts(
      (categoryRows.data ?? []).map((r) => ({ key: r.property_type as string })),
      (key) => getPropertyCategoryLabel(key)
    ),
    conversion: {
      viewToInquiryRate: pct(totalClicks, totalViews),
      whatsappFunnelRate: pct(funnelLeads, funnelClicks),
      listingApprovalRate: pct(approvedThisMonth, submittedThisMonth),
      paymentSuccessRate: pct(
        paymentSuccessfulMonth,
        paymentSuccessfulMonth + paymentFailedMonth
      ),
      agentSignupShare: pct(newAgentsThisMonth, newUsersThisMonth),
    },
  };
}
