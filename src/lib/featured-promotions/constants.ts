export const FEATURED_PROMOTION_TYPE = "featured" as const;

export type FeaturedDurationDays = 7 | 30;

export type FeaturedPromotionStatus =
  | "pending"
  | "paid"
  | "active"
  | "expired"
  | "cancelled"
  | "failed";

export const FEATURED_PRICING: Record<
  FeaturedDurationDays,
  { amount: number; currency: "NGN"; label: string }
> = {
  7: { amount: 2999, currency: "NGN", label: "7 Days" },
  30: { amount: 5999, currency: "NGN", label: "30 Days" },
};

export function isFeaturedDurationDays(value: number): value is FeaturedDurationDays {
  return value === 7 || value === 30;
}

export function featuredPriceForDays(days: FeaturedDurationDays): number {
  return FEATURED_PRICING[days].amount;
}
