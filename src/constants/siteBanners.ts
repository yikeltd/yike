export const MOBILE_HEADER_PLACEMENT = "mobile_header" as const;

export const BANNER_PLACEMENTS = [
  { id: "mobile_header", label: "Mobile header strip" },
  { id: "homepage_hero", label: "Homepage hero" },
  { id: "homepage_inline", label: "Homepage inline" },
  { id: "search_page", label: "Search page" },
  { id: "listing_page", label: "Listing detail page" },
  { id: "swipe_page", label: "Swipe / browse page" },
  { id: "saved_page", label: "Saved page" },
  { id: "mobile_sticky_cta", label: "Mobile sticky CTA" },
] as const;

export type SiteBannerPlacement = (typeof BANNER_PLACEMENTS)[number]["id"];

export const DEFAULT_VERIFICATION_BANNER = {
  title: "Let Yike Help You Verify That Property Before You Pay",
  subtitle:
    "Reduce fake listings, wasted travel, and costly surprises with independent property verification.",
  ctaText: "Request Verification",
  linkUrl: "/property-verification",
} as const;
