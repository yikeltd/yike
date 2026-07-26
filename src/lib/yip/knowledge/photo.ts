/**
 * Default photo knowledge provider — static tips by domain/category.
 *
 * Deliberately static (no vision model, no sharp analysis — that lives in
 * `media/*` as a stub). Kept in sync by hand with listing-engine category
 * manifests; see docs/architecture/YIKE_INTELLIGENCE_PLATFORM.md migration
 * notes for consolidating this into a single source later.
 */
import type { MarketplaceDomain } from "../shared/types";
import type { PhotoGuidance, PhotoKnowledge } from "./types";

const DEFAULT_GUIDANCE: PhotoGuidance = { min: 1, max: 20, tips: ["Well-lit", "In focus", "No watermarks"] };

const DOMAIN_GUIDANCE: Record<string, PhotoGuidance> = {
  vehicle: { min: 1, max: 20, tips: ["Front", "Rear", "Interior", "Dashboard", "Engine", "Tyres"] },
  property: {
    min: 3,
    max: 25,
    tips: ["Exterior", "Living room", "Bedrooms", "Kitchen", "Bathroom", "Compound"],
  },
};

const CATEGORY_GUIDANCE: Record<string, PhotoGuidance> = {
  land: { min: 2, max: 15, tips: ["Boundary/fence", "Access road", "Survey pillar", "Wide angle"] },
  motorcycle: { min: 1, max: 12, tips: ["Front", "Side", "Rear", "Engine", "Chassis number"] },
};

export class DefaultPhotoKnowledge implements PhotoKnowledge {
  getGuidance(domain: MarketplaceDomain, categoryId?: string): PhotoGuidance {
    if (categoryId && CATEGORY_GUIDANCE[categoryId]) return CATEGORY_GUIDANCE[categoryId];
    return DOMAIN_GUIDANCE[domain] ?? DEFAULT_GUIDANCE;
  }
}

export function createPhotoKnowledge(): PhotoKnowledge {
  return new DefaultPhotoKnowledge();
}
