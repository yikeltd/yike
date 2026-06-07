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
