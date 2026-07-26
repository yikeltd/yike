/**
 * Knowledge Layer types — the "what does the platform already know" surface.
 *
 * These interfaces are pure lookups over existing marketplace data (makes,
 * models, categories, locations). No inference, no ML — see
 * `docs/architecture/YIKE_INTELLIGENCE_PLATFORM.md` for what's deliberately
 * out of scope this sprint.
 */
import type { KnowledgeOption, MarketplaceDomain, Result } from "../shared/types";

export interface VehicleKnowledge {
  listCategories(): KnowledgeOption[];
  listMakes(): KnowledgeOption[];
  listModelsForMake(make: string): KnowledgeOption[];
  isValidModelForMake(make: string, model: string): boolean;
  /** Spec option lists keyed by spec field (transmission, fuel_type, condition, body_type, drivetrain, registration_status). */
  listSpecOptions(specKey: string): KnowledgeOption[];
}

export interface PropertyKnowledge {
  listListingTypes(): KnowledgeOption[];
  listCategoryGroups(): KnowledgeOption[];
  listPropertyTypesForListingType(listingType: string): KnowledgeOption[];
  listAmenities(): KnowledgeOption[];
  getPropertyTypeLabel(value: string): string;
}

export interface LocationKnowledge {
  listStates(): KnowledgeOption[];
  listCitiesForState(state: string): KnowledgeOption[];
  listAreasForCity(state: string, city: string): KnowledgeOption[];
  getStateForCity(city: string): string | undefined;
}

export type PriceSuggestionInput = {
  domain: MarketplaceDomain;
  categoryId: string;
  location?: { state?: string; city?: string };
  attributes?: Record<string, unknown>;
};

export type PriceSuggestionUnavailable = {
  available: false;
  reason: "insufficient_data" | (string & {});
};

export type PriceSuggestionAvailable = {
  available: true;
  currency: "NGN";
  low: number;
  median: number;
  high: number;
  sampleSize: number;
  confidence: "low" | "medium" | "high";
};

export type PriceSuggestion = PriceSuggestionUnavailable | PriceSuggestionAvailable;

export interface MarketKnowledge {
  /** CORE always returns `{ available: false }` — real comps require a data pipeline (V2). */
  getPriceSuggestion(input: PriceSuggestionInput): Result<PriceSuggestion>;
}

export type PhotoGuidance = {
  min: number;
  max: number;
  tips: string[];
};

export interface PhotoKnowledge {
  getGuidance(domain: MarketplaceDomain, categoryId?: string): PhotoGuidance;
}

/** Resolves which knowledge domain governs a given listing category id. */
export interface CategoryKnowledge {
  getDomainForCategory(categoryId: string): MarketplaceDomain | undefined;
  listKnownCategories(domain: MarketplaceDomain): string[];
}
