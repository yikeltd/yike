import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_REVENUE_OFFERS,
  DEFAULT_REVENUE_PRICING,
} from "@/lib/revenue-pricing/defaults";
import type {
  RevenueOffers,
  RevenuePricingCatalog,
  RevenuePricingItem,
  RevenueProduct,
  SubscriptionBillingTermRow,
  SubscriptionPlanPricing,
} from "@/lib/revenue-pricing/types";
import { DEFAULT_BILLING_TERMS, listBillingTerms } from "@/lib/subscriptions/billing-terms";

function mapItem(row: Record<string, unknown>): RevenuePricingItem {
  return {
    id: row.id as string,
    product: row.product as string,
    variant_key: row.variant_key as string,
    label: row.label as string,
    amount: Number(row.amount ?? 0),
    currency: (row.currency as string) ?? "NGN",
    duration_days: row.duration_days != null ? Number(row.duration_days) : null,
    duration_hours: row.duration_hours != null ? Number(row.duration_hours) : null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    active: Boolean(row.active),
    sort_order: Number(row.sort_order ?? 0),
    updated_at: row.updated_at as string,
  };
}

async function fetchCatalogFromDb(
  admin: SupabaseClient,
  includeInactive = false
): Promise<RevenuePricingCatalog> {
  let itemsQuery = admin
    .from("revenue_pricing_items")
    .select("*")
    .order("sort_order", { ascending: true });

  if (!includeInactive) {
    itemsQuery = itemsQuery.eq("active", true);
  }

  const [{ data: items }, { data: offers }, { data: subscriptions }, billingTerms] =
    await Promise.all([
      itemsQuery,
      admin.from("revenue_offers").select("*").eq("id", true).maybeSingle(),
      admin
        .from("subscription_plans")
        .select("id, name, plan_code, monthly_price, active_listing_limit, features, status")
        .order("monthly_price", { ascending: true }),
      listBillingTerms(admin, { includeInactive }),
    ]);

  const mappedItems = (items ?? []).map((r) => mapItem(r as Record<string, unknown>));

  return {
    items: mappedItems.length ? mappedItems : DEFAULT_REVENUE_PRICING.map((d, i) => ({
      ...d,
      id: `default-${i}`,
      updated_at: new Date().toISOString(),
    })),
    offers: offers
      ? {
          founding_subscription_offer: Boolean(offers.founding_subscription_offer),
          updated_at: offers.updated_at as string,
        }
      : DEFAULT_REVENUE_OFFERS,
    subscriptions: (subscriptions ?? []) as SubscriptionPlanPricing[],
    billingTerms: billingTerms.map(
      (term): SubscriptionBillingTermRow => ({
        id: term.id,
        months: term.months,
        label: term.label,
        short_label: term.shortLabel,
        discount_percent: term.discountPercent,
        active: term.active,
        sort_order: term.sortOrder,
        updated_at: new Date().toISOString(),
      })
    ),
  };
}

function defaultBillingTermRows(): SubscriptionBillingTermRow[] {
  return DEFAULT_BILLING_TERMS.map((term) => ({
    id: term.id,
    months: term.months,
    label: term.label,
    short_label: term.shortLabel,
    discount_percent: term.discountPercent,
    active: term.active,
    sort_order: term.sortOrder,
    updated_at: new Date().toISOString(),
  }));
}

export async function getRevenuePricingCatalog(
  admin: SupabaseClient,
  options?: { includeInactive?: boolean }
): Promise<RevenuePricingCatalog> {
  return fetchCatalogFromDb(admin, options?.includeInactive ?? false);
}

export const getCachedPublicRevenueCatalog = unstable_cache(
  async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    if (!admin) {
      return {
        items: DEFAULT_REVENUE_PRICING.map((d, i) => ({
          ...d,
          id: `default-${i}`,
          updated_at: new Date().toISOString(),
        })),
        offers: DEFAULT_REVENUE_OFFERS,
        subscriptions: [],
        billingTerms: defaultBillingTermRows(),
      } satisfies RevenuePricingCatalog;
    }
    return fetchCatalogFromDb(admin, false);
  },
  ["revenue-pricing-public-catalog"],
  { revalidate: 60, tags: ["revenue-pricing"] }
);

export async function getRevenuePrice(
  admin: SupabaseClient,
  product: RevenueProduct | string,
  variantKey: string
): Promise<number | null> {
  const { data } = await admin
    .from("revenue_pricing_items")
    .select("amount, active")
    .eq("product", product)
    .eq("variant_key", variantKey)
    .maybeSingle();

  if (data && data.active !== false) {
    return Number(data.amount);
  }

  const fallback = DEFAULT_REVENUE_PRICING.find(
    (i) => i.product === product && i.variant_key === variantKey
  );
  return fallback?.amount ?? null;
}

export async function getRevenuePricingItem(
  admin: SupabaseClient,
  product: RevenueProduct | string,
  variantKey: string
): Promise<RevenuePricingItem | null> {
  const { data } = await admin
    .from("revenue_pricing_items")
    .select("*")
    .eq("product", product)
    .eq("variant_key", variantKey)
    .maybeSingle();

  if (data) return mapItem(data as Record<string, unknown>);

  const fallback = DEFAULT_REVENUE_PRICING.find(
    (i) => i.product === product && i.variant_key === variantKey
  );
  if (!fallback) return null;
  return {
    ...fallback,
    id: `default-${product}-${variantKey}`,
    updated_at: new Date().toISOString(),
  };
}

export async function getRevenueOffers(admin: SupabaseClient): Promise<RevenueOffers> {
  const { data } = await admin.from("revenue_offers").select("*").eq("id", true).maybeSingle();
  if (!data) return DEFAULT_REVENUE_OFFERS;
  return {
    founding_subscription_offer: Boolean(data.founding_subscription_offer),
    updated_at: data.updated_at as string,
  };
}

export { catalogToMap, getCatalogPrice } from "@/lib/revenue-pricing/catalog-utils";
