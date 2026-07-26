/**
 * Builds a listing-engine `CatalogMap`-compatible object from the
 * `KnowledgeFacade`, for catalog ids already used by listing-engine
 * category manifests (`vehicle.makes`, `property.states`, etc).
 *
 * This file intentionally does NOT import from `listing-engine` — the
 * shape below (`{ value, label }` options, `(values) => options[]`
 * providers) is structurally identical to listing-engine's `CatalogProvider`
 * so the listing-engine side can consume this map directly. See
 * `src/lib/listing-engine/catalogs/yip-bridge.ts` for the consumer.
 */
import type { KnowledgeOption } from "../shared/types";
import type { KnowledgeFacade } from "./index";

export type CatalogLikeProvider = (values: Record<string, unknown>) => KnowledgeOption[];
export type CatalogLikeMap = Record<string, CatalogLikeProvider>;

export function buildCatalogMapFromKnowledge(knowledge: KnowledgeFacade): CatalogLikeMap {
  return {
    "vehicle.types": () => knowledge.vehicle.listCategories(),
    "vehicle.makes": () => knowledge.vehicle.listMakes(),
    "vehicle.models_for_make": (values) => knowledge.vehicle.listModelsForMake(String(values.make ?? "")),
    "vehicle.transmission": () => knowledge.vehicle.listSpecOptions("transmission"),
    "vehicle.fuel_type": () => knowledge.vehicle.listSpecOptions("fuel_type"),
    "vehicle.condition": () => knowledge.vehicle.listSpecOptions("condition"),
    "vehicle.body_type": () => knowledge.vehicle.listSpecOptions("body_type"),
    "vehicle.drivetrain": () => knowledge.vehicle.listSpecOptions("drivetrain"),
    "vehicle.registration_status": () => knowledge.vehicle.listSpecOptions("registration_status"),
    "property.listing_types": () => knowledge.property.listListingTypes(),
    "property.types_for_listing": (values) =>
      knowledge.property.listPropertyTypesForListingType(String(values.listing_type ?? "rent")),
    "property.states": () => knowledge.location.listStates(),
    "property.cities_for_state": (values) => knowledge.location.listCitiesForState(String(values.state ?? "")),
    "property.areas_for_city": (values) =>
      knowledge.location.listAreasForCity(String(values.state ?? ""), String(values.city ?? "")),
    "property.amenities": () => knowledge.property.listAmenities(),
  };
}
