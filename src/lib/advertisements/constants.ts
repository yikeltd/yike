export type CampaignType =
  | "hero_spotlight"
  | "featured_listing"
  | "category_spotlight"
  | "section_spotlight"
  | "homepage_promotion"
  | "search_promotion"
  | "dealer_promotion"
  | "enterprise_campaign"
  | "future_campaign";

export type AdvertisementPlacement =
  | "homepage_top"
  | "homepage_middle"
  | "search_results"
  | "homepage_slot_1"
  | "homepage_slot_2"
  | "homepage_slot_3"
  | "homepage_slot_4"
  | "homepage_slot_5"
  | "HOME_HERO"
  | "HOME_SECTION"
  | "HOME_FOOTER"
  | "SEARCH_TOP"
  | "SEARCH_INLINE"
  | "VEHICLE_CATEGORY"
  | "PROPERTY_CATEGORY"
  | "LISTING_DETAILS"
  | "DEALER_PROFILE"
  | "SELLER_DASHBOARD"
  | "PUBLISH_SUCCESS"
  | "DISCOVER"
  | "NEARBY"
  | "SAVED"
  | "CHAT_RECOMMENDATION";

export type HomepageAdSlot =
  | "homepage_slot_1"
  | "homepage_slot_2"
  | "homepage_slot_3"
  | "homepage_slot_4"
  | "homepage_slot_5";

export type AdvertisementStatus =
  | "draft"
  | "pending"
  | "pending_approval"
  | "approved"
  | "scheduled"
  | "live"
  | "active"
  | "paused"
  | "expired"
  | "completed"
  | "rejected"
  | "archived";

export type AdvertisementDurationPlan = "week" | "month";

export const HOMEPAGE_AD_SLOTS: HomepageAdSlot[] = [
  "homepage_slot_1",
  "homepage_slot_2",
  "homepage_slot_3",
  "homepage_slot_4",
  "homepage_slot_5",
];

export const ADVERTISEMENT_PLACEMENTS: Record<
  AdvertisementPlacement,
  { label: string; hint: string }
> = {
  homepage_slot_1: {
    label: "Homepage slot 1",
    hint: "After Featured — banner only when active.",
  },
  homepage_slot_2: {
    label: "Homepage slot 2",
    hint: "After Recently Added — banner only when active.",
  },
  homepage_slot_3: {
    label: "Homepage slot 3",
    hint: "After Near You / Popular Near You — banner only when active.",
  },
  homepage_slot_4: {
    label: "Homepage slot 4",
    hint: "After Luxury Collection — banner only when active.",
  },
  homepage_slot_5: {
    label: "Homepage slot 5",
    hint: "After Recommended (or next available rail) — banner only when active.",
  },
  homepage_top: {
    label: "Homepage hero (legacy)",
    hint: "Legacy secondary hero — prefer slots 1–5.",
  },
  homepage_middle: {
    label: "Homepage mid (legacy)",
    hint: "Legacy mid-page — prefer slots 1–5.",
  },
  search_results: {
    label: "Search results",
    hint: "In-feed after a few listings — one sponsored slot.",
  },
  HOME_HERO: {
    label: "Home Hero Spotlight",
    hint: "Top billboard placement on main landing view.",
  },
  HOME_SECTION: {
    label: "Home Section Banner",
    hint: "Mid-page section divider banner.",
  },
  HOME_FOOTER: {
    label: "Home Footer Spotlight",
    hint: "Bottom homepage conversion banner.",
  },
  SEARCH_TOP: {
    label: "Search Top Banner",
    hint: "Pinned banner above search filter controls.",
  },
  SEARCH_INLINE: {
    label: "Search In-Feed Card",
    hint: "Native grid card inside search results.",
  },
  VEHICLE_CATEGORY: {
    label: "Vehicle Category Header",
    hint: "Category header on /vehicles browse hub.",
  },
  PROPERTY_CATEGORY: {
    label: "Property Category Header",
    hint: "Category header on /properties browse hub.",
  },
  LISTING_DETAILS: {
    label: "Listing Detail Sidebar",
    hint: "Sidebar ad on property and vehicle details.",
  },
  DEALER_PROFILE: {
    label: "Dealer Profile Spotlight",
    hint: "Featured banner on dealer/agency storefronts.",
  },
  SELLER_DASHBOARD: {
    label: "Seller Dashboard Banner",
    hint: "Promotions for active marketplace sellers.",
  },
  PUBLISH_SUCCESS: {
    label: "Publish Success View",
    hint: "Post-submission promotion banner.",
  },
  DISCOVER: {
    label: "Discover Feed Banner",
    hint: "Inline ad inside visual discover feed.",
  },
  NEARBY: {
    label: "Nearby Listings Hub",
    hint: "Location-aware ad on geo-search pages.",
  },
  SAVED: {
    label: "Saved Items Hub",
    hint: "Sponsored recommendation on saved listings.",
  },
  CHAT_RECOMMENDATION: {
    label: "Chat Recommendation",
    hint: "Contextual recommendation card in messaging.",
  },
};

export const ADVERTISEMENT_PRICING: Record<
  AdvertisementPlacement,
  Record<AdvertisementDurationPlan, number>
> = {
  homepage_slot_1: { week: 20_000, month: 60_000 },
  homepage_slot_2: { week: 18_000, month: 55_000 },
  homepage_slot_3: { week: 16_000, month: 50_000 },
  homepage_slot_4: { week: 15_000, month: 45_000 },
  homepage_slot_5: { week: 14_000, month: 40_000 },
  homepage_top: { week: 20_000, month: 60_000 },
  homepage_middle: { week: 15_000, month: 40_000 },
  search_results: { week: 10_000, month: 30_000 },
  HOME_HERO: { week: 35_000, month: 120_000 },
  HOME_SECTION: { week: 20_000, month: 60_000 },
  HOME_FOOTER: { week: 15_000, month: 45_000 },
  SEARCH_TOP: { week: 25_000, month: 75_000 },
  SEARCH_INLINE: { week: 15_000, month: 45_000 },
  VEHICLE_CATEGORY: { week: 20_000, month: 60_000 },
  PROPERTY_CATEGORY: { week: 20_000, month: 60_000 },
  LISTING_DETAILS: { week: 18_000, month: 50_000 },
  DEALER_PROFILE: { week: 15_000, month: 45_000 },
  SELLER_DASHBOARD: { week: 12_000, month: 35_000 },
  PUBLISH_SUCCESS: { week: 10_000, month: 30_000 },
  DISCOVER: { week: 18_000, month: 50_000 },
  NEARBY: { week: 15_000, month: 45_000 },
  SAVED: { week: 10_000, month: 30_000 },
  CHAT_RECOMMENDATION: { week: 15_000, month: 45_000 },
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

export function isHomepageAdSlot(value: string): value is HomepageAdSlot {
  return (HOMEPAGE_AD_SLOTS as string[]).includes(value);
}

export function isAdvertisementPlacement(value: string): value is AdvertisementPlacement {
  return value in ADVERTISEMENT_PLACEMENTS;
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

/** Internal path or absolute http(s) URL. */
export function isValidAdDestinationUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
