/**
 * Property catalog providers — wire existing location/type constants into
 * the category-agnostic engine. No business logic lives here, only lookups.
 */
import { LISTING_TYPES, propertyTypesForListingType } from "@/constants/listingTypes";
import { NIGERIAN_AMENITIES } from "@/constants/amenities";
import { getCitiesForState, getAreasForCity, NIGERIAN_STATES } from "@/constants/nigeriaLocations";
import type { CatalogMap } from "./types";

export const PROPERTY_CATALOGS: CatalogMap = {
  "property.listing_types": () => LISTING_TYPES.map((t) => ({ value: t.value, label: t.label })),
  "property.types_for_listing": (values) => {
    const listingType = String(values.listing_type ?? "rent");
    return propertyTypesForListingType(listingType).map((t) => ({
      value: t.value,
      label: t.label,
    }));
  },
  "property.states": () => NIGERIAN_STATES.map((s) => ({ value: s, label: s })),
  "property.cities_for_state": (values) => {
    const state = String(values.state ?? "");
    return getCitiesForState(state).map((c) => ({ value: c, label: c }));
  },
  "property.areas_for_city": (values) => {
    const state = String(values.state ?? "");
    const city = String(values.city ?? "");
    return getAreasForCity(state, city).map((a) => ({ value: a, label: a }));
  },
  "property.amenities": () =>
    NIGERIAN_AMENITIES.map((a) => ({ value: a.id, label: a.label })),
};
