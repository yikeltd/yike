const PLACEMENT_SURFACE: Record<string, string> = {
  browse: "swipe",
  card: "listing_card",
  detail: "listing_detail",
  sticky: "listing_detail",
  agent_card: "listing_detail",
  share: "whatsapp_flow",
  saved: "saved",
  featured: "featured_listing",
};

/** Infer lead source surface from page path + optional explicit surface. */
export function inferLeadSourceSurface(
  sourcePage: string,
  explicit?: string | null,
  placement?: string | null
): string {
  const surface = explicit?.trim();
  if (surface) return surface.slice(0, 64);

  if (placement && PLACEMENT_SURFACE[placement]) {
    return PLACEMENT_SURFACE[placement];
  }

  const path = sourcePage.toLowerCase();
  if (path.includes("/browse")) return "swipe";
  if (path.includes("/search")) return "search";
  if (path.includes("/properties/")) return "listing_detail";
  if (path.includes("/houses/")) return "seo_area_page";
  if (path.includes("/saved")) return "saved";
  if (path.includes("/agents/")) return "agent_profile";
  if (path === "/" || path.includes("home")) return "homepage";
  if (path.includes("featured")) return "featured";
  return "other";
}

export type LeadAttributionInput = {
  sourcePage?: string;
  sourceSurface?: string | null;
  sourceListingPosition?: number | null;
  sourceCampaign?: string | null;
  placement?: string;
};

export type LeadAttributionExtras = {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  referral?: string | null;
  device?: string | null;
  city?: string | null;
  listingType?: string | null;
};

export function buildLeadAttribution(input: LeadAttributionInput) {
  const sourcePage = input.sourcePage ?? "";
  return {
    source_surface: inferLeadSourceSurface(
      sourcePage,
      input.sourceSurface ?? null,
      input.placement ?? null
    ),
    source_page: sourcePage || null,
    source_listing_position:
      input.sourceListingPosition != null &&
      Number.isFinite(input.sourceListingPosition)
        ? Math.round(input.sourceListingPosition)
        : null,
    source_campaign: input.sourceCampaign?.trim().slice(0, 128) || null,
    inquiry_status: "new" as const,
  };
}

/** Pack UTM/device/referral for listing_leads.metadata + lead_events (no schema required). */
export function buildLeadAttributionMetadata(
  input: LeadAttributionExtras
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (input.utmSource) out.utm_source = input.utmSource.slice(0, 128);
  if (input.utmMedium) out.utm_medium = input.utmMedium.slice(0, 128);
  if (input.utmCampaign) out.utm_campaign = input.utmCampaign.slice(0, 128);
  if (input.utmContent) out.utm_content = input.utmContent.slice(0, 128);
  if (input.utmTerm) out.utm_term = input.utmTerm.slice(0, 128);
  if (input.referral) out.referral = input.referral.slice(0, 128);
  if (input.device) out.device = input.device.slice(0, 32);
  if (input.city) out.city = input.city.slice(0, 64);
  if (input.listingType) out.listing_type = input.listingType.slice(0, 32);
  return out;
}
