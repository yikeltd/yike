/**
 * Marketplace Analytics Control Tower — internal founder/ops metrics.
 * Reads existing tables only. No new schema, no customer-facing product.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getPropertyCategoryLabel } from "@/constants/propertyCategories";

export type RankedCount = {
  key: string;
  label: string;
  count: number;
};

export type GrowthPoint = {
  label: string;
  listings: number;
  users: number;
};

export type MarketplaceAnalyticsMetrics = {
  generatedAt: string;
  marketplace: {
    total: number;
    vehicles: number;
    properties: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  users: {
    newToday: number;
    sellers: number;
    buyers: number;
    dealers: number;
    verifiedDealers: number;
  };
  activity: {
    searchesToday: number;
    listingViewsToday: number;
    dealerProfileViewsToday: number | null;
    contactAttemptsToday: number;
    savedToday: number;
    reportsToday: number;
    /** Lifetime engagement proxies from listing counters */
    listingViewsAllTime: number;
    contactClicksAllTime: number;
  };
  inventory: {
    byCity: RankedCount[];
    byCategory: RankedCount[];
    byMake: RankedCount[];
    byPriceRange: RankedCount[];
  };
  trust: {
    verifiedSellers: number;
    mediaProtectedListings: number;
    flaggedListings: number;
    pendingReviews: number;
    openReports: number;
  };
  growth: {
    daily: GrowthPoint[];
    weekly: GrowthPoint[];
    monthly: GrowthPoint[];
  };
};

function startOfDayIso(d = new Date()): string {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

function daysAgoIso(n: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function monthStartIso(monthsAgo = 0): string {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() - monthsAgo);
  return d.toISOString();
}

function pctBarLabel(n: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(6, Math.round((n / max) * 100));
}

function aggregate(
  rows: Array<{ key: string | null | undefined }>,
  labelFor: (key: string) => string,
  limit = 10,
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

function priceBucket(price: number): string {
  if (!Number.isFinite(price) || price <= 0) return "Unpriced";
  if (price < 5_000_000) return "Under ₦5M";
  if (price < 10_000_000) return "₦5M–₦10M";
  if (price < 25_000_000) return "₦10M–₦25M";
  if (price < 50_000_000) return "₦25M–₦50M";
  if (price < 100_000_000) return "₦50M–₦100M";
  return "₦100M+";
}

const PRICE_ORDER = [
  "Under ₦5M",
  "₦5M–₦10M",
  "₦10M–₦25M",
  "₦25M–₦50M",
  "₦50M–₦100M",
  "₦100M+",
  "Unpriced",
];

async function headCount(
  admin: SupabaseClient,
  table: string,
  apply?: (q: ReturnType<SupabaseClient["from"]>) => unknown,
): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin.from(table).select("*", { count: "exact", head: true });
  if (apply) query = apply(query) ?? query;
  const { count } = await query;
  return count ?? 0;
}

async function countListingEventsToday(
  admin: SupabaseClient,
  eventTypes: string[],
  sinceIso: string,
): Promise<number> {
  const { count } = await admin
    .from("listing_analytics_events")
    .select("*", { count: "exact", head: true })
    .in("event_type", eventTypes)
    .gte("created_at", sinceIso);
  return count ?? 0;
}

async function countFunnelToday(
  admin: SupabaseClient,
  eventTypes: string[],
  sinceIso: string,
): Promise<number> {
  const { count } = await admin
    .from("funnel_events")
    .select("*", { count: "exact", head: true })
    .in("event_type", eventTypes)
    .gte("created_at", sinceIso);
  return count ?? 0;
}

async function countCreatedBetween(
  admin: SupabaseClient,
  table: "properties" | "profiles",
  fromIso: string,
  toIso: string,
): Promise<number> {
  const { count } = await admin
    .from(table)
    .select("*", { count: "exact", head: true })
    .gte("created_at", fromIso)
    .lt("created_at", toIso);
  return count ?? 0;
}

async function safeHeadCount(
  admin: SupabaseClient,
  table: string,
  apply?: (q: ReturnType<SupabaseClient["from"]>) => unknown,
  fallback = 0,
): Promise<number> {
  try {
    return await headCount(admin, table, apply);
  } catch {
    return fallback;
  }
}

async function countMediaProtectedListings(admin: SupabaseClient): Promise<number> {
  try {
    const { data, error } = await admin
      .from("media_assets")
      .select("listing_id")
      .not("listing_id", "is", null)
      .limit(8000);
    if (error) return 0;
    const ids = new Set(
      (data ?? [])
        .map((row: { listing_id: string | null }) => row.listing_id)
        .filter(Boolean) as string[],
    );
    return ids.size;
  } catch {
    return 0;
  }
}

async function countOpenReports(admin: SupabaseClient): Promise<number> {
  try {
    return await headCount(admin, "listing_reports", (q) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (q as any).eq("status", "open"),
    );
  } catch {
    return 0;
  }
}

export async function getMarketplaceAnalyticsMetrics(
  admin: SupabaseClient,
): Promise<MarketplaceAnalyticsMetrics> {
  const todayStart = startOfDayIso();
  const tomorrow = new Date(todayStart);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = tomorrow.toISOString();

  const [
    total,
    vehicles,
    properties,
    pending,
    approved,
    rejected,
    newToday,
    sellers,
    buyers,
    dealers,
    verifiedDealerRows,
    searchesToday,
    listingViewsToday,
    contactListingToday,
    contactFunnelToday,
    savedToday,
    reportsToday,
    engagementRows,
    cityRows,
    categoryRows,
    makeRows,
    priceRows,
    verifiedSellerCount,
    mediaProtected,
    flagged,
    pendingReviews,
    openReports,
  ] = await Promise.all([
    headCount(admin, "properties"),
    headCount(admin, "properties", (q) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (q as any).eq("asset_type", "VEHICLE"),
    ),
    headCount(admin, "properties", (q) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (q as any).or("asset_type.eq.PROPERTY,asset_type.is.null"),
    ),
    headCount(admin, "properties", (q) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (q as any).eq("status", "pending"),
    ),
    headCount(admin, "properties", (q) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (q as any).eq("status", "approved"),
    ),
    headCount(admin, "properties", (q) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (q as any).eq("status", "rejected"),
    ),
    headCount(admin, "profiles", (q) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (q as any).gte("created_at", todayStart),
    ),
    headCount(admin, "profiles", (q) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (q as any).in("role", ["agent", "agent_unverified", "agent_verified"]),
    ),
    headCount(admin, "profiles", (q) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (q as any).eq("role", "user"),
    ),
    headCount(admin, "profiles", (q) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (q as any).eq("account_type", "dealer"),
    ),
    admin
      .from("profiles")
      .select("role, verification_status, verified_badge, account_type")
      .eq("account_type", "dealer")
      .limit(2000),
    countListingEventsToday(admin, ["search_impression"], todayStart),
    countListingEventsToday(admin, ["view"], todayStart),
    countListingEventsToday(
      admin,
      ["whatsapp_click", "call_click"],
      todayStart,
    ),
    countFunnelToday(
      admin,
      [
        "whatsapp_button_clicked",
        "call_button_clicked",
        "direct_whatsapp_used",
        "direct_call_used",
        "lead_created",
      ],
      todayStart,
    ),
    countListingEventsToday(admin, ["save"], todayStart).then(async (n) => {
      if (n > 0) return n;
      return headCount(admin, "favorites", (q) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (q as any).gte("created_at", todayStart),
      );
    }),
    headCount(admin, "listing_reports", (q) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (q as any).gte("created_at", todayStart),
    ),
    admin
      .from("properties")
      .select("views_count, contact_clicks")
      .eq("status", "approved")
      .limit(8000),
    admin
      .from("properties")
      .select("city")
      .eq("status", "approved")
      .not("city", "is", null)
      .limit(8000),
    admin
      .from("properties")
      .select("property_type, auto_category, asset_type")
      .eq("status", "approved")
      .limit(8000),
    admin
      .from("properties")
      .select("make")
      .eq("status", "approved")
      .eq("asset_type", "VEHICLE")
      .not("make", "is", null)
      .limit(8000),
    admin
      .from("properties")
      .select("price")
      .eq("status", "approved")
      .limit(8000),
    headCount(admin, "profiles", (q) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (q as any).or(
        "verified_badge.eq.true,role.eq.agent_verified,verification_status.eq.approved",
      ),
    ),
    countMediaProtectedListings(admin),
    safeHeadCount(admin, "properties", (q) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (q as any).eq("abuse_review_flag", true),
    ),
    headCount(admin, "properties", (q) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (q as any).eq("status", "pending"),
    ),
    countOpenReports(admin),
  ]);

  const verifiedDealers = (
    (verifiedDealerRows.data ?? []) as Array<{
      role?: string | null;
      verification_status?: string | null;
      verified_badge?: boolean | null;
    }>
  ).filter(
    (p) =>
      Boolean(p.verified_badge) ||
      p.role === "agent_verified" ||
      p.verification_status === "approved" ||
      p.verification_status === "verified",
  ).length;

  const engagement = (engagementRows.data ?? []) as Array<{
    views_count?: number | null;
    contact_clicks?: number | null;
  }>;
  const listingViewsAllTime = engagement.reduce(
    (s: number, r) => s + (r.views_count ?? 0),
    0,
  );
  const contactClicksAllTime = engagement.reduce(
    (s: number, r) => s + (r.contact_clicks ?? 0),
    0,
  );

  const categoryData = (categoryRows.data ?? []) as Array<{
    property_type?: string | null;
    auto_category?: string | null;
    asset_type?: string | null;
  }>;
  const byCategory = aggregate(
    categoryData.map((r) => ({
      key:
        r.asset_type === "VEHICLE"
          ? (r.auto_category as string)
          : (r.property_type as string),
    })),
    (key) =>
      key.includes("_") || key.length <= 20
        ? getPropertyCategoryLabel(key) !== key
          ? getPropertyCategoryLabel(key)
          : key.replace(/_/g, " ")
        : key,
  );

  const byPriceMap = new Map<string, number>();
  for (const row of (priceRows.data ?? []) as Array<{ price?: number | null }>) {
    const label = priceBucket(Number(row.price));
    byPriceMap.set(label, (byPriceMap.get(label) ?? 0) + 1);
  }
  const byPriceRange: RankedCount[] = PRICE_ORDER.filter((k) =>
    byPriceMap.has(k),
  ).map((key) => ({
    key,
    label: key,
    count: byPriceMap.get(key) ?? 0,
  }));

  // Growth: last 7 days, last 8 weeks, last 6 months
  const dailyRanges = Array.from({ length: 7 }, (_, idx) => {
    const i = 6 - idx;
    const from = daysAgoIso(i);
    const toDate = new Date(from);
    toDate.setDate(toDate.getDate() + 1);
    return {
      label: new Date(from).toLocaleDateString("en-NG", {
        weekday: "short",
        day: "numeric",
      }),
      from,
      to: toDate.toISOString(),
    };
  });

  const weeklyRanges = Array.from({ length: 8 }, (_, idx) => {
    const i = 7 - idx;
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    return {
      label: `W${idx + 1}`,
      from: start.toISOString(),
      to: new Date(end.getTime() + 86_400_000).toISOString(),
    };
  });

  const monthlyRanges = Array.from({ length: 6 }, (_, idx) => {
    const i = 5 - idx;
    const fromIso = monthStartIso(i);
    const toIso = i === 0 ? tomorrowIso : monthStartIso(i - 1);
    return {
      label: new Date(fromIso).toLocaleDateString("en-NG", { month: "short" }),
      from: fromIso,
      to: toIso,
    };
  });

  const [daily, weekly, monthly] = await Promise.all([
    Promise.all(
      dailyRanges.map(async (r) => {
        const [listings, users] = await Promise.all([
          countCreatedBetween(admin, "properties", r.from, r.to),
          countCreatedBetween(admin, "profiles", r.from, r.to),
        ]);
        return { label: r.label, listings, users };
      }),
    ),
    Promise.all(
      weeklyRanges.map(async (r) => {
        const [listings, users] = await Promise.all([
          countCreatedBetween(admin, "properties", r.from, r.to),
          countCreatedBetween(admin, "profiles", r.from, r.to),
        ]);
        return { label: r.label, listings, users };
      }),
    ),
    Promise.all(
      monthlyRanges.map(async (r) => {
        const [listings, users] = await Promise.all([
          countCreatedBetween(admin, "properties", r.from, r.to),
          countCreatedBetween(admin, "profiles", r.from, r.to),
        ]);
        return { label: r.label, listings, users };
      }),
    ),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    marketplace: {
      total,
      vehicles,
      properties,
      pending,
      approved,
      rejected,
    },
    users: {
      newToday,
      sellers,
      buyers,
      dealers,
      verifiedDealers,
    },
    activity: {
      searchesToday,
      listingViewsToday,
      dealerProfileViewsToday: null, // not instrumented in DB
      contactAttemptsToday: contactListingToday + contactFunnelToday,
      savedToday,
      reportsToday,
      listingViewsAllTime,
      contactClicksAllTime,
    },
    inventory: {
      byCity: aggregate(
        ((cityRows.data ?? []) as Array<{ city?: string | null }>).map((r) => ({
          key: r.city as string,
        })),
        (k) => k,
      ),
      byCategory,
      byMake: aggregate(
        ((makeRows.data ?? []) as Array<{ make?: string | null }>).map((r) => ({
          key: r.make as string,
        })),
        (k) => k,
      ),
      byPriceRange,
    },
    trust: {
      verifiedSellers: verifiedSellerCount,
      mediaProtectedListings: mediaProtected,
      flaggedListings: flagged,
      pendingReviews,
      openReports,
    },
    growth: { daily, weekly, monthly },
  };
}

export { pctBarLabel };
