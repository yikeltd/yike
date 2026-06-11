export type AdvertisementPlacement =
  | "homepage_top"
  | "homepage_middle"
  | "search_results";

export type AdvertisementStatus =
  | "draft"
  | "pending"
  | "active"
  | "paused"
  | "expired";

export type AdvertisementDurationPlan = "week" | "month";

export const ADVERTISEMENT_PLACEMENTS: Record<
  AdvertisementPlacement,
  { label: string; hint: string }
> = {
  homepage_top: {
    label: "Homepage hero secondary",
    hint: "Below hero search — max 1 active banner.",
  },
  homepage_middle: {
    label: "Homepage mid-page",
    hint: "Between listing sections — subtle sponsored card.",
  },
  search_results: {
    label: "Search results",
    hint: "In-feed after a few listings — one sponsored slot.",
  },
};

export const ADVERTISEMENT_PRICING: Record<
  AdvertisementPlacement,
  Record<AdvertisementDurationPlan, number>
> = {
  homepage_top: { week: 20_000, month: 60_000 },
  homepage_middle: { week: 15_000, month: 40_000 },
  search_results: { week: 10_000, month: 30_000 },
};

export const ADVERTISER_TYPES = [
  "developer",
  "agency",
  "estate_company",
  "property_manager",
  "mortgage",
  "law_firm",
  "surveyor",
  "moving_company",
  "interior_designer",
  "home_services",
] as const;

export type AdvertiserType = (typeof ADVERTISER_TYPES)[number];

export const ADVERTISER_TYPE_LABELS: Record<AdvertiserType, string> = {
  developer: "Developer",
  agency: "Agency",
  estate_company: "Estate company",
  property_manager: "Property manager",
  mortgage: "Mortgage company",
  law_firm: "Law firm",
  surveyor: "Surveyor",
  moving_company: "Moving company",
  interior_designer: "Interior designer",
  home_services: "Home services",
};

export const PROHIBITED_AD_CATEGORIES = [
  "betting",
  "adult",
  "crypto",
  "non_compliant_loans",
  "political",
  "misleading_property",
  "illegal",
] as const;

export const SPONSORED_LABEL = "Sponsored";

export function isAdvertisementPlacement(value: string): value is AdvertisementPlacement {
  return value === "homepage_top" || value === "homepage_middle" || value === "search_results";
}

export function isDurationPlan(value: string): value is AdvertisementDurationPlan {
  return value === "week" || value === "month";
}

export function priceForAd(
  placement: AdvertisementPlacement,
  plan: AdvertisementDurationPlan
): number {
  return ADVERTISEMENT_PRICING[placement][plan];
}

export function durationDays(plan: AdvertisementDurationPlan): number {
  return plan === "week" ? 7 : 30;
}
