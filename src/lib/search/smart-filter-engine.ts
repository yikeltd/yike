/**
 * Smart Filter Engine — vertical routing and URL param mapping (SSOT).
 */

import { ELECTRONICS_CATEGORIES, ELECTRONICS_CONDITIONS } from "@/lib/marketplace/electronics-specs";

export type FilterVertical =
  | "all"
  | "property"
  | "vehicle"
  | "electronics"
  | "land"
  | "agent";

export const FILTER_VERTICAL_LABELS: Record<FilterVertical, string> = {
  all: "All Categories",
  property: "Properties",
  vehicle: "Vehicles",
  electronics: "Electronics",
  land: "Land",
  agent: "Agents",
};

/** Common electronics brands for filter UI (make/brand field on listings). */
export const ELECTRONICS_BRANDS = [
  "Apple",
  "Samsung",
  "Tecno",
  "Infinix",
  "Xiaomi",
  "Oppo",
  "Vivo",
  "Itel",
  "Huawei",
  "HP",
  "Dell",
  "Lenovo",
  "Asus",
  "Acer",
  "LG",
  "Sony",
  "Hisense",
  "Panasonic",
  "Haier",
  "Binatone",
  "Mikano",
  "Sumec",
  "Firman",
  "Lutian",
] as const;

export type SmartFilterFormState = {
  vertical: FilterVertical;
  state?: string;
  city?: string;
  q?: string;
  /** Property */
  property_type?: string;
  listing_type?: string;
  beds?: string;
  min?: string;
  max?: string;
  /** Vehicle */
  vehicle_category?: string;
  vehicle_group?: string;
  make?: string;
  model?: string;
  vehicle_condition?: string;
  max_mileage?: string;
  max_operating_hours?: string;
  /** Electronics */
  category?: string;
  brand?: string;
  condition?: string;
  min_price?: string;
  max_price?: string;
  /** Agent */
  role?: string;
};

export function filterRouteForVertical(vertical: FilterVertical): string {
  switch (vertical) {
    case "vehicle":
      return "/vehicles";
    case "electronics":
      return "/electronics";
    case "agent":
      return "/agents";
    case "land":
    case "property":
    case "all":
    default:
      return "/search";
  }
}

/** Build query string from smart filter form — keys match browse pages. */
export function smartFilterToUrlParams(
  filters: SmartFilterFormState,
): URLSearchParams {
  const params = new URLSearchParams();
  const { vertical } = filters;

  if (filters.state) params.set("state", filters.state);
  if (filters.city) params.set("city", filters.city);
  if (filters.q?.trim()) params.set("q", filters.q.trim());

  const min = filters.min_price || filters.min;
  const max = filters.max_price || filters.max;
  if (min) params.set(vertical === "electronics" || vertical === "vehicle" ? "min_price" : "min", min);
  if (max) params.set(vertical === "electronics" || vertical === "vehicle" ? "max_price" : "max", max);

  if (vertical === "property" || vertical === "all" || vertical === "land") {
    if (vertical === "land") params.set("hub", "land_sale");
    if (filters.property_type) params.set("property_type", filters.property_type);
    if (filters.listing_type) params.set("type", filters.listing_type);
    if (filters.beds) params.set("beds", filters.beds);
  }

  if (vertical === "vehicle" || (vertical === "all" && filters.make)) {
    if (filters.vehicle_group) params.set("group", filters.vehicle_group);
    if (filters.vehicle_category) params.set("category", filters.vehicle_category);
    if (filters.make) params.set("make", filters.make);
    if (filters.model) params.set("model", filters.model);
    if (filters.vehicle_condition) params.set("condition", filters.vehicle_condition);
    if (filters.max_mileage) params.set("max_mileage", filters.max_mileage);
    if (filters.max_operating_hours) {
      params.set("max_operating_hours", filters.max_operating_hours);
    }
  }

  if (vertical === "electronics") {
    if (filters.category) params.set("category", filters.category);
    if (filters.brand) params.set("brand", filters.brand);
    if (filters.condition) params.set("condition", filters.condition);
  }

  if (vertical === "agent" && filters.role) {
    params.set("role", filters.role);
  }

  if (vertical === "all") {
    params.set("marketplace", "all");
  }

  return params;
}

export function buildSmartFilterHref(filters: SmartFilterFormState): string {
  const path = filterRouteForVertical(filters.vertical);
  const qs = smartFilterToUrlParams(filters).toString();
  return qs ? `${path}?${qs}` : path;
}

export function defaultSmartFilterState(
  vertical: FilterVertical = "all",
): SmartFilterFormState {
  return {
    vertical,
    state: "",
    city: "",
    q: "",
    property_type: "",
    listing_type: "",
    beds: "",
    min: "",
    max: "",
    make: "",
    model: "",
    vehicle_category: "",
    vehicle_group: "",
    vehicle_condition: "",
    max_mileage: "",
    max_operating_hours: "",
    category: "",
    brand: "",
    condition: "",
    min_price: "",
    max_price: "",
    role: "",
  };
}

/** Clear fields that do not apply when switching vertical tabs. */
export function clearIncompatibleFilterFields(
  prev: SmartFilterFormState,
  nextVertical: FilterVertical,
): SmartFilterFormState {
  const base: SmartFilterFormState = {
    ...prev,
    vertical: nextVertical,
  };

  if (nextVertical === "electronics") {
    return {
      ...base,
      property_type: "",
      listing_type: "",
      beds: "",
      make: "",
      model: "",
      vehicle_category: "",
    vehicle_group: "",
    vehicle_condition: "",
    max_mileage: "",
    max_operating_hours: "",
      role: "",
      min: "",
      max: "",
    };
  }

  if (nextVertical === "vehicle") {
    return {
      ...base,
      property_type: "",
      listing_type: "",
      beds: "",
      category: "",
      brand: "",
      condition: "",
      role: "",
      min: "",
      max: "",
    };
  }

  if (nextVertical === "agent") {
    return {
      ...base,
      property_type: "",
      listing_type: "",
      beds: "",
      make: "",
      model: "",
      vehicle_category: "",
    vehicle_group: "",
    vehicle_condition: "",
    max_mileage: "",
    max_operating_hours: "",
      category: "",
      brand: "",
      condition: "",
      min: "",
      max: "",
      min_price: "",
      max_price: "",
    };
  }

  if (nextVertical === "land") {
    return {
      ...base,
      make: "",
      model: "",
      vehicle_category: "",
    vehicle_group: "",
    vehicle_condition: "",
    max_mileage: "",
    max_operating_hours: "",
      category: "",
      brand: "",
      condition: "",
      role: "",
      min_price: "",
      max_price: "",
    };
  }

  if (nextVertical === "property") {
    return {
      ...base,
      make: "",
      model: "",
      vehicle_category: "",
    vehicle_group: "",
    vehicle_condition: "",
    max_mileage: "",
    max_operating_hours: "",
      category: "",
      brand: "",
      condition: "",
      role: "",
      min_price: "",
      max_price: "",
    };
  }

  // all — keep only shared location, q, budget (prefer generic min/max)
  return {
    ...base,
    property_type: "",
    listing_type: "",
    beds: "",
    make: "",
    model: "",
    vehicle_category: "",
    vehicle_group: "",
    vehicle_condition: "",
    max_mileage: "",
    max_operating_hours: "",
    category: "",
    brand: "",
    condition: "",
    role: "",
    min_price: "",
    max_price: "",
  };
}

export function resolveFilterVerticalFromRoute(
  pathname: string,
  sp: URLSearchParams,
): FilterVertical {
  if (pathname.startsWith("/vehicles")) return "vehicle";
  if (pathname.startsWith("/electronics")) return "electronics";
  if (pathname.startsWith("/agents")) return "agent";
  if (pathname.startsWith("/search")) {
    if (sp.get("marketplace") === "all") return "all";
    if (sp.get("hub") === "land_sale") return "land";
    if (
      sp.get("property_type") ||
      sp.get("type") ||
      sp.get("beds") ||
      sp.get("baths") ||
      sp.get("amenity")
    ) {
      return "property";
    }
    return "property";
  }
  return "property";
}

/** Hydrate smart filter form from current route + query string (SSOT for filter sheet). */
export function hydrateSmartFilterFormState(
  pathname: string,
  sp: URLSearchParams,
  activeVertical?: FilterVertical,
): SmartFilterFormState {
  const vertical = activeVertical ?? resolveFilterVerticalFromRoute(pathname, sp);
  const base = defaultSmartFilterState(vertical);
  const minBudget = sp.get("min") ?? sp.get("min_price") ?? "";
  const maxBudget = sp.get("max") ?? sp.get("max_price") ?? "";

  const shared = {
    ...base,
    q: sp.get("q") ?? "",
    state: sp.get("state") ?? "",
    city: sp.get("city") ?? "",
  };

  if (vertical === "vehicle") {
    return {
      ...shared,
      min_price: minBudget,
      max_price: maxBudget,
      vehicle_category: sp.get("category") ?? "",
      vehicle_group: sp.get("group") ?? "",
      make: sp.get("make") ?? "",
      model: sp.get("model") ?? "",
      vehicle_condition: sp.get("condition") ?? "",
      max_mileage: sp.get("max_mileage") ?? "",
      max_operating_hours: sp.get("max_operating_hours") ?? "",
    };
  }

  if (vertical === "electronics") {
    return {
      ...shared,
      min_price: minBudget,
      max_price: maxBudget,
      category: sp.get("category") ?? "",
      brand: sp.get("brand") ?? "",
      condition: sp.get("condition") ?? "",
    };
  }

  if (vertical === "agent") {
    return {
      ...shared,
      role: sp.get("role") ?? "",
    };
  }

  if (vertical === "land") {
    return {
      ...shared,
      listing_type: sp.get("type") ?? "",
      property_type: sp.get("property_type") ?? "land",
      min: minBudget,
      max: maxBudget,
    };
  }

  if (vertical === "all") {
    return {
      ...shared,
      min: minBudget,
      max: maxBudget,
    };
  }

  return {
    ...shared,
    listing_type: sp.get("type") ?? "",
    property_type: sp.get("property_type") ?? "",
    beds: sp.get("beds") ?? "",
    min: minBudget,
    max: maxBudget,
  };
}

/** @deprecated Use hydrateSmartFilterFormState */
export function parseSmartFilterFromSearchParams(
  sp: URLSearchParams,
  pathname: string,
): Partial<SmartFilterFormState> {
  return hydrateSmartFilterFormState(pathname, sp);
}

export { ELECTRONICS_CATEGORIES, ELECTRONICS_CONDITIONS };
