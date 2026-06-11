import type { AdPlacementKey } from "@/constants/adPlacements";
import type { AdvertisementPlacement } from "@/lib/advertisements/constants";
import type { SiteBannerPlacement } from "@/constants/siteBanners";
import type { ImagePreset } from "@/lib/media/constants";

/** What staff should design in Figma — upload pipeline compresses to WebP. */
export type AdminCreativeSpec = {
  designSize: string;
  aspectRatio: string;
  displaySize?: string;
  preset?: ImagePreset;
  format?: string;
  notes?: string;
};

export const ADMIN_UPLOAD_FORMAT =
  "JPG, PNG, or HEIC — compressed to WebP on upload." as const;

export const MOBILE_HEADER_BANNER_SPEC: AdminCreativeSpec = {
  designSize: "160 × 160 px",
  aspectRatio: "1 : 1",
  displaySize: "40 × 40 px thumbnail in strip",
  preset: "square",
  format: ADMIN_UPLOAD_FORMAT,
  notes:
    "Optional — title and message work without an image. Full strip is text-first on mobile.",
};

export const EMAIL_TRANSACTIONAL_SPEC: AdminCreativeSpec = {
  designSize: "160 × 160 px",
  aspectRatio: "1 : 1",
  displaySize: "80 × 80 px in email",
  preset: "square",
  format: ADMIN_UPLOAD_FORMAT,
  notes:
    "Design at 160×160 px for retina display. Stored as optimized 160×160 WebP and displayed at 80×80 in email.",
};

/** Website ad_placements slots — matches on-site aspect classes. */
export const AD_PLACEMENT_CREATIVE_SPECS: Record<AdPlacementKey, AdminCreativeSpec> = {
  home_feed_mid: {
    designSize: "768 × 432 px",
    aspectRatio: "16 : 9",
    displaySize: "Full-width in-feed card",
    preset: "card",
    format: ADMIN_UPLOAD_FORMAT,
    notes: "4 : 3 (768 × 576 px) also accepted.",
  },
  home_discover: {
    designSize: "1200 × 500 px",
    aspectRatio: "2.4 : 1",
    displaySize: "Full-width banner",
    preset: "banner",
    format: ADMIN_UPLOAD_FORMAT,
  },
  search_top: {
    designSize: "1200 × 500 px",
    aspectRatio: "2.4 : 1",
    displaySize: "Below search filters",
    preset: "banner",
    format: ADMIN_UPLOAD_FORMAT,
  },
  search_feed_mid: {
    designSize: "768 × 480 px",
    aspectRatio: "16 : 10",
    displaySize: "In-feed card after 6th result",
    preset: "card",
    format: ADMIN_UPLOAD_FORMAT,
  },
  location_top: {
    designSize: "1200 × 500 px",
    aspectRatio: "2.4 : 1",
    displaySize: "Above city / area listings",
    preset: "banner",
    format: ADMIN_UPLOAD_FORMAT,
  },
  property_detail: {
    designSize: "768 × 480 px",
    aspectRatio: "16 : 10",
    displaySize: "Above related listings",
    preset: "card",
    format: ADMIN_UPLOAD_FORMAT,
    notes: "Keep key copy away from bottom — WhatsApp bar stays visible.",
  },
  footer_strip: {
    designSize: "1200 × 200 px",
    aspectRatio: "6 : 1",
    displaySize: "Wide strip above footer",
    preset: "strip",
    format: ADMIN_UPLOAD_FORMAT,
  },
  auth_login_footer: {
    designSize: "640 × 400 px",
    aspectRatio: "16 : 10",
    displaySize: "Compact card on sign-in",
    preset: "card",
    format: ADMIN_UPLOAD_FORMAT,
  },
  email_transactional: EMAIL_TRANSACTIONAL_SPEC,
  agent_listing_form: {
    designSize: "1200 × 500 px",
    aspectRatio: "2.4 : 1",
    displaySize: "Under Payment period on listing form",
    preset: "banner",
    format: ADMIN_UPLOAD_FORMAT,
  },
  home_hotspot_1: {
    designSize: "768 × 480 px",
    aspectRatio: "16 : 10",
    displaySize: "Large spotlight card",
    preset: "card",
    format: ADMIN_UPLOAD_FORMAT,
    notes: "Or pin a listing — image optional when a listing is selected.",
  },
  home_hotspot_2: {
    designSize: "768 × 480 px",
    aspectRatio: "16 : 10",
    displaySize: "Second spotlight card",
    preset: "card",
    format: ADMIN_UPLOAD_FORMAT,
    notes: "Or pin a listing — image optional when a listing is selected.",
  },
};

export const SPONSORED_AD_CREATIVE_SPECS: Record<
  AdvertisementPlacement,
  { desktop: AdminCreativeSpec; mobile: AdminCreativeSpec }
> = {
  homepage_top: {
    desktop: {
      designSize: "1200 × 500 px",
      aspectRatio: "2.4 : 1",
      displaySize: "Below hero search (max ~160 px tall)",
      preset: "banner",
      format: ADMIN_UPLOAD_FORMAT,
    },
    mobile: {
      designSize: "880 × 400 px",
      aspectRatio: "2.2 : 1",
      displaySize: "Optional mobile crop",
      preset: "banner",
      format: ADMIN_UPLOAD_FORMAT,
      notes: "Falls back to desktop image if omitted.",
    },
  },
  homepage_middle: {
    desktop: {
      designSize: "1200 × 500 px",
      aspectRatio: "2.4 : 1",
      displaySize: "Between home sections",
      preset: "banner",
      format: ADMIN_UPLOAD_FORMAT,
    },
    mobile: {
      designSize: "880 × 400 px",
      aspectRatio: "2.2 : 1",
      displaySize: "Optional mobile crop",
      preset: "banner",
      format: ADMIN_UPLOAD_FORMAT,
    },
  },
  search_results: {
    desktop: {
      designSize: "880 × 400 px",
      aspectRatio: "2.2 : 1",
      displaySize: "In-feed after listings (max ~120 px tall)",
      preset: "banner",
      format: ADMIN_UPLOAD_FORMAT,
    },
    mobile: {
      designSize: "880 × 400 px",
      aspectRatio: "2.2 : 1",
      displaySize: "Same crop used on mobile",
      preset: "banner",
      format: ADMIN_UPLOAD_FORMAT,
    },
  },
};

/** Promo banners (site_banners) — text-first; layout notes per placement. */
export const PROMO_BANNER_PLACEMENT_SPECS: Record<
  SiteBannerPlacement,
  { layout: string; notes?: string }
> = {
  mobile_header: {
    layout: "Compact strip — optional 160×160 thumb",
    notes: "Managed on Mobile header banners page with image upload.",
  },
  homepage_hero: {
    layout: "Text card — no image upload on promos",
    notes: "Headline + subtext + CTA. Keep copy under ~90 characters.",
  },
  homepage_inline: {
    layout: "Inline text card between sections",
    notes: "Calm trust copy works best. No image field.",
  },
  search_page: {
    layout: "Text promo on search",
    notes: "Short headline + one line subtext.",
  },
  listing_page: {
    layout: "Text promo on listing detail",
    notes: "Do not compete with WhatsApp CTA.",
  },
  swipe_page: {
    layout: "Text promo on swipe feed",
    notes: "Minimal copy — users are browsing listings.",
  },
  saved_page: {
    layout: "Text promo on saved listings",
    notes: "Encourage verification or listing quality tips.",
  },
  mobile_sticky_cta: {
    layout: "Sticky bottom CTA bar",
    notes: "Use sparingly. Text-only button + short message.",
  },
};

export function getAdPlacementCreativeSpec(
  key: AdPlacementKey
): AdminCreativeSpec {
  return AD_PLACEMENT_CREATIVE_SPECS[key];
}

export function formatCreativeSpecLine(spec: AdminCreativeSpec): string {
  const parts = [
    `Design ${spec.designSize}`,
    spec.aspectRatio,
    spec.displaySize ? `displays ${spec.displaySize}` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}
