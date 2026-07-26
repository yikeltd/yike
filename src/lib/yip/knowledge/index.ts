/**
 * Knowledge Layer public surface — `KnowledgeFacade` composes the individual
 * providers behind one object so callers don't need five separate imports.
 */
import type { MarketplaceDomain } from "../shared/types";
import { createLocationKnowledge } from "./location";
import { createMarketKnowledge } from "./market";
import { createPhotoKnowledge } from "./photo";
import { createPropertyKnowledge } from "./property";
import { createVehicleKnowledge } from "./vehicle";
import type {
  CategoryKnowledge,
  LocationKnowledge,
  MarketKnowledge,
  PhotoKnowledge,
  PropertyKnowledge,
  VehicleKnowledge,
} from "./types";

/** Category id → domain map. Static today; a category registry can replace this later. */
const CATEGORY_DOMAIN: Record<string, MarketplaceDomain> = {
  vehicle: "vehicle",
  property: "property",
};

export class DefaultCategoryKnowledge implements CategoryKnowledge {
  getDomainForCategory(categoryId: string): MarketplaceDomain | undefined {
    return CATEGORY_DOMAIN[categoryId];
  }

  listKnownCategories(domain: MarketplaceDomain): string[] {
    return Object.entries(CATEGORY_DOMAIN)
      .filter(([, d]) => d === domain)
      .map(([id]) => id);
  }
}

export class KnowledgeFacade {
  constructor(
    readonly vehicle: VehicleKnowledge = createVehicleKnowledge(),
    readonly property: PropertyKnowledge = createPropertyKnowledge(),
    readonly location: LocationKnowledge = createLocationKnowledge(),
    readonly market: MarketKnowledge = createMarketKnowledge(),
    readonly photo: PhotoKnowledge = createPhotoKnowledge(),
    readonly category: CategoryKnowledge = new DefaultCategoryKnowledge(),
  ) {}
}

export function createKnowledgeFacade(): KnowledgeFacade {
  return new KnowledgeFacade();
}

export type {
  CategoryKnowledge,
  LocationKnowledge,
  MarketKnowledge,
  PhotoGuidance,
  PhotoKnowledge,
  PriceSuggestion,
  PriceSuggestionAvailable,
  PriceSuggestionInput,
  PriceSuggestionUnavailable,
  PropertyKnowledge,
  VehicleKnowledge,
} from "./types";
export { createLocationKnowledge } from "./location";
export { createMarketKnowledge } from "./market";
export { createPhotoKnowledge } from "./photo";
export { createPropertyKnowledge } from "./property";
export { createVehicleKnowledge } from "./vehicle";
