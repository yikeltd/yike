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
  make?: string;
  model?: string;
  vehicle_condition?: string;
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
    if (filters.make) params.set("make", filters.make);
    if (filters.model) params.set("model", filters.model);
    if (filters.vehicle_condition) params.set("condition", filters.vehicle_condition);
  }

  if (vertical === "electronics") {
    if (filters.category) params.set("category", filters.category);
    if (filters.brand) params.set("brand", filters.brand);
    if (filters.condition) params.set("condition", filters.condition);
  }

  if (vertical === "agent" && filters.role) {
    params.set("role", filters.role);
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
    vehicle_condition: "",
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
      vehicle_condition: "",
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
      vehicle_condition: "",
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
      vehicle_condition: "",
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
      vehicle_condition: "",
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
    vehicle_condition: "",
    category: "",
    brand: "",
    condition: "",
    role: "",
    min_price: "",
    max_price: "",
  };
}

export function parseSmartFilterFromSearchParams(
  sp: URLSearchParams,
  pathname: string,
): Partial<SmartFilterFormState> {
  const vertical: FilterVertical =
    pathname.startsWith("/vehicles")
      ? "vehicle"
      : pathname.startsWith("/electronics")
        ? "electronics"
        : pathname.startsWith("/agents")
          ? "agent"
          : sp.get("hub") === "land_sale"
            ? "land"
            : "property";

  return {
    vertical,
    state: sp.get("state") ?? "",
    city: sp.get("city") ?? "",
    q: sp.get("q") ?? "",
    category: sp.get("category") ?? "",
    brand: sp.get("brand") ?? "",
    condition: sp.get("condition") ?? "",
    make: sp.get("make") ?? "",
    model: sp.get("model") ?? "",
    vehicle_condition: sp.get("condition") ?? "",
    min_price: sp.get("min_price") ?? sp.get("min") ?? "",
    max_price: sp.get("max_price") ?? sp.get("max") ?? "",
  };
}

export { ELECTRONICS_CATEGORIES, ELECTRONICS_CONDITIONS };
