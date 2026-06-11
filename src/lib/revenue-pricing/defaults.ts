import type { RevenuePricingItem } from "@/lib/revenue-pricing/types";

/** Bootstrap fallback if DB row missing — matches migration seed. */
export const DEFAULT_REVENUE_PRICING: Omit<RevenuePricingItem, "id" | "updated_at">[] = [
  { product: "featured_listing", variant_key: "7d", label: "Featured · 7 days", amount: 2999, currency: "NGN", duration_days: 7, duration_hours: null, metadata: {}, active: true, sort_order: 10 },
  { product: "featured_listing", variant_key: "30d", label: "Featured · 30 days", amount: 5999, currency: "NGN", duration_days: 30, duration_hours: null, metadata: {}, active: true, sort_order: 20 },
  { product: "boost_listing", variant_key: "24h", label: "Boost · 24 hours", amount: 999, currency: "NGN", duration_days: null, duration_hours: 24, metadata: {}, active: true, sort_order: 30 },
  { product: "boost_listing", variant_key: "7d", label: "Boost · 7 days", amount: 2499, currency: "NGN", duration_days: 7, duration_hours: null, metadata: {}, active: true, sort_order: 40 },
  { product: "verification_fee", variant_key: "standard", label: "Business Verified", amount: 4999, currency: "NGN", duration_days: null, duration_hours: null, metadata: {}, active: true, sort_order: 50 },
  { product: "property_verification", variant_key: "basic", label: "Basic verification", amount: 4999, currency: "NGN", duration_days: null, duration_hours: null, metadata: {}, active: true, sort_order: 60 },
  { product: "property_verification", variant_key: "standard", label: "Standard verification", amount: 14999, currency: "NGN", duration_days: null, duration_hours: null, metadata: {}, active: true, sort_order: 70 },
  { product: "property_verification", variant_key: "premium", label: "Premium verification", amount: 29999, currency: "NGN", duration_days: null, duration_hours: null, metadata: {}, active: true, sort_order: 80 },
  { product: "lead_insights", variant_key: "monthly", label: "Lead Insights · monthly", amount: 4999, currency: "NGN", duration_days: 30, duration_hours: null, metadata: {}, active: true, sort_order: 90 },
  { product: "advertisement", variant_key: "homepage_top_week", label: "Homepage hero · 1 week", amount: 20000, currency: "NGN", duration_days: 7, duration_hours: null, metadata: {}, active: true, sort_order: 100 },
  { product: "advertisement", variant_key: "homepage_top_month", label: "Homepage hero · 1 month", amount: 60000, currency: "NGN", duration_days: 30, duration_hours: null, metadata: {}, active: true, sort_order: 110 },
  { product: "advertisement", variant_key: "homepage_middle_week", label: "Homepage mid · 1 week", amount: 15000, currency: "NGN", duration_days: 7, duration_hours: null, metadata: {}, active: true, sort_order: 120 },
  { product: "advertisement", variant_key: "homepage_middle_month", label: "Homepage mid · 1 month", amount: 40000, currency: "NGN", duration_days: 30, duration_hours: null, metadata: {}, active: true, sort_order: 130 },
  { product: "advertisement", variant_key: "search_results_week", label: "Search in-feed · 1 week", amount: 10000, currency: "NGN", duration_days: 7, duration_hours: null, metadata: {}, active: true, sort_order: 140 },
  { product: "advertisement", variant_key: "search_results_month", label: "Search in-feed · 1 month", amount: 30000, currency: "NGN", duration_days: 30, duration_hours: null, metadata: {}, active: true, sort_order: 150 },
];

export const DEFAULT_REVENUE_OFFERS = {
  founding_subscription_offer: true,
  updated_at: new Date().toISOString(),
};
