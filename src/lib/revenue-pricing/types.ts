export type RevenueProduct =
  | "featured_listing"
  | "boost_listing"
  | "verification_fee"
  | "property_verification"
  | "advertisement"
  | "lead_insights";

export type RevenuePricingItem = {
  id: string;
  product: RevenueProduct | string;
  variant_key: string;
  label: string;
  amount: number;
  currency: string;
  duration_days: number | null;
  duration_hours: number | null;
  metadata: Record<string, unknown>;
  active: boolean;
  sort_order: number;
  updated_at: string;
};

export type RevenueOffers = {
  founding_subscription_offer: boolean;
  updated_at: string;
};

export type SubscriptionPlanPricing = {
  id: string;
  name: string;
  plan_code: string;
  monthly_price: number;
  active_listing_limit: number | null;
  features: Record<string, unknown>;
  status: string;
};

export type RevenuePricingCatalog = {
  items: RevenuePricingItem[];
  offers: RevenueOffers;
  subscriptions: SubscriptionPlanPricing[];
};
