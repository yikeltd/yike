import type { BannerCampaignType } from "@/lib/verification/campaign-targeting";

export const MOBILE_HEADER_PLACEMENT = "mobile_header" as const;

export const BANNER_PLACEMENTS = [
  { id: "mobile_header", label: "Mobile header strip" },
  { id: "homepage_hero", label: "Homepage hero" },
  { id: "homepage_inline", label: "Homepage inline" },
  { id: "search_page", label: "Search page" },
  { id: "listing_page", label: "Listing detail page" },
  { id: "swipe_page", label: "Swipe / browse page" },
  { id: "saved_page", label: "Saved page" },
  { id: "mobile_sticky_cta", label: "Mobile sticky CTA (use sparingly)" },
] as const;

export type SiteBannerPlacement = (typeof BANNER_PLACEMENTS)[number]["id"];

export const BANNER_CAMPAIGN_LABELS: Record<BannerCampaignType, string> = {
  general_promo: "General promo",
  verification_promo: "Verification assistance",
  legal_review_promo: "Legal review assistance",
  relocation_assistance: "Relocation assistance",
  premium_trust_assistance: "Premium trust assistance",
};

/** Admin form defaults only — never rendered unless saved as an active banner. */
export const DEFAULT_PREMIUM_TRUST_BANNER = {
  campaignType: "premium_trust_assistance" as const,
  title: "Need extra confidence before committing?",
  subtitle:
    "For major property decisions, Yike may assist with independent verification coordination.",
  ctaText: "Learn more",
  linkUrl: "/property-verification",
};

/** @deprecated use DEFAULT_PREMIUM_TRUST_BANNER */
export const DEFAULT_VERIFICATION_BANNER = DEFAULT_PREMIUM_TRUST_BANNER;
