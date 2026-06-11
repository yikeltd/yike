export const FEATURED_PROMOTION_TYPE = "featured" as const;
export const BOOST_PROMOTION_TYPE = "boost" as const;

export type PromotionType = typeof FEATURED_PROMOTION_TYPE | typeof BOOST_PROMOTION_TYPE;

export type FeaturedDurationDays = 7 | 30;
export type BoostDurationHours = 24;
export type BoostDurationDays = 7;

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
  7: { amount: 2999, currency: "NGN", label: "7 days" },
  30: { amount: 5999, currency: "NGN", label: "30 days" },
};

export const BOOST_PRICING = {
  hours24: { amount: 999, currency: "NGN" as const, label: "24 hours", durationHours: 24 as const, durationDays: 0 as const },
  days7: { amount: 2499, currency: "NGN" as const, label: "7 days", durationHours: null, durationDays: 7 as const },
};

export type BoostPlanId = "hours24" | "days7";

export const BOOST_PLANS: Record<BoostPlanId, (typeof BOOST_PRICING)[BoostPlanId]> = BOOST_PRICING;

/** Score applied to listing when boost promotion is active */
export const BOOST_PROMOTION_SCORE = 30;

export function isFeaturedDurationDays(value: number): value is FeaturedDurationDays {
  return value === 7 || value === 30;
}

export function isBoostPlanId(value: string): value is BoostPlanId {
  return value === "hours24" || value === "days7";
}

export function featuredPriceForDays(days: FeaturedDurationDays): number {
  return FEATURED_PRICING[days].amount;
}

export function boostPriceForPlan(plan: BoostPlanId): number {
  return BOOST_PRICING[plan].amount;
}

export function promotionTypeLabel(type: PromotionType): string {
  return type === "featured" ? "Featured" : "Boost";
}

export function promotionStatusLabel(status: FeaturedPromotionStatus): string {
  const labels: Record<FeaturedPromotionStatus, string> = {
    pending: "Pending",
    paid: "Paid",
    active: "Active",
    expired: "Expired",
    cancelled: "Cancelled",
    failed: "Failed",
  };
  return labels[status];
}
