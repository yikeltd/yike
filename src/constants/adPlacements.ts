/** Keys must match ad_placements.placement_key in Supabase */

export const AD_PLACEMENT_KEYS = [
  "home_feed_mid",
  "home_discover",
  "search_top",
  "search_feed_mid",
  "location_top",
  "property_detail",
  "footer_strip",
  "auth_login_footer",
  "email_transactional",
  "agent_listing_form",
  "home_hotspot_1",
  "home_hotspot_2",
] as const;

export type AdPlacementKey = (typeof AD_PLACEMENT_KEYS)[number];

export const AD_PLACEMENT_META: Record<
  AdPlacementKey,
  { label: string; hint: string; aspect: "banner" | "card" | "strip" }
> = {
  home_feed_mid: {
    label: "Home feed — mid scroll",
    hint: "Shows after the 4th listing on mobile home feed. 16:9 or 4:3 image.",
    aspect: "card",
  },
  home_discover: {
    label: "Home — after Explore Nigeria",
    hint: "Full-width banner between discovery hubs and city sections.",
    aspect: "banner",
  },
  search_top: {
    label: "Search — above results",
    hint: "Banner below filters when users browse search results.",
    aspect: "banner",
  },
  search_feed_mid: {
    label: "Search — mid results",
    hint: "In-feed card after the 6th listing in search results.",
    aspect: "card",
  },
  location_top: {
    label: "City / area SEO pages",
    hint: "Above listings on /lagos/lekki-style pages.",
    aspect: "banner",
  },
  property_detail: {
    label: "Listing detail page",
    hint: "Below description, before related listings. Do not cover WhatsApp bar.",
    aspect: "card",
  },
  footer_strip: {
    label: "Footer sponsor strip",
    hint: "Wide strip above site footer on all public pages.",
    aspect: "strip",
  },
  auth_login_footer: {
    label: "Sign in — below Terms & Privacy",
    hint: "Compact card under the Terms and Privacy links on /auth/login.",
    aspect: "card",
  },
  email_transactional: {
    label: "Transactional email — under headline",
    hint: "Compact promo chip directly under the email headline (in the fold). Use a square thumb ~80×80px. Shown on OTP, welcome, listing updates — not admin alerts.",
    aspect: "card",
  },
  agent_listing_form: {
    label: "Agent listing form — price step",
    hint: "Shown under Payment period while an agent creates a listing. Use for listing tips, boosts, verification, or sponsor ads.",
    aspect: "banner",
  },
  home_hotspot_1: {
    label: "Home — Hottest pick slot 1",
    hint: "Large spotlight card below search. Set a listing ID or title override.",
    aspect: "card",
  },
  home_hotspot_2: {
    label: "Home — Hottest pick slot 2",
    hint: "Second spotlight card on home. Set a listing ID or title override.",
    aspect: "card",
  },
};
