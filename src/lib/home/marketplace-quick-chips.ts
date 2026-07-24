import type { Property } from "@/types/database";
import type { HomeMarketplaceCategory } from "@/lib/home/marketplace-category";

export type QuickChip = {
  id: string;
  label: string;
  /** Optional visual prefix — decorative; label remains accessible text. */
  emoji?: string;
};

export const PROPERTY_QUICK_CHIPS: readonly QuickChip[] = [
  { id: "apartments", label: "Apartments", emoji: "🏠" },
  { id: "duplexes", label: "Duplexes", emoji: "🏡" },
  { id: "land", label: "Land", emoji: "🌿" },
  { id: "commercial", label: "Commercial", emoji: "🏢" },
  { id: "luxury", label: "Luxury", emoji: "✨" },
  { id: "shortlets", label: "Short Lets", emoji: "🔑" },
] as const;

export const VEHICLE_QUICK_CHIPS: readonly QuickChip[] = [
  { id: "car", label: "Cars", emoji: "🚗" },
  { id: "suv", label: "SUVs", emoji: "🚙" },
  { id: "pickup", label: "Pickups", emoji: "🛻" },
  { id: "bus", label: "Buses", emoji: "🚌" },
  { id: "motorcycle", label: "Motorcycles", emoji: "🏍️" },
  { id: "ev", label: "EVs", emoji: "⚡" },
] as const;

const APARTMENT_TYPES = new Set([
  "self_contain",
  "room",
  "mini_flat",
  "flat_2",
  "flat_3",
  "flat",
  "shared_apt",
  "shortlet_apt",
  "hotel_apt",
]);

const DUPLEX_TYPES = new Set([
  "duplex",
  "terrace_duplex",
  "detached_duplex",
]);

const LAND_TYPES = new Set([
  "land",
  "land_residential",
  "land_commercial",
  "land_farm",
]);

const COMMERCIAL_TYPES = new Set([
  "shop",
  "office",
  "plaza",
  "warehouse",
  "event_center",
]);

const SHORTLET_TYPES = new Set([
  "shortlet_apt",
  "airbnb",
  "hotel_apt",
  "guest_house",
]);

const LUXURY_TYPES = new Set([
  "mansion",
  "detached_duplex",
  "terrace_duplex",
]);

function matchesPropertyChip(p: Property, chipId: string): boolean {
  const type = (p.property_type ?? "").toLowerCase();
  const listing = (p.listing_type ?? "").toLowerCase();

  switch (chipId) {
    case "apartments":
      return APARTMENT_TYPES.has(type);
    case "duplexes":
      return DUPLEX_TYPES.has(type) || type.includes("duplex");
    case "land":
      return LAND_TYPES.has(type) || listing === "land";
    case "commercial":
      return COMMERCIAL_TYPES.has(type);
    case "shortlets":
      return listing === "shortlet" || SHORTLET_TYPES.has(type);
    case "luxury":
      return LUXURY_TYPES.has(type) || type.includes("mansion");
    default:
      return true;
  }
}

function matchesVehicleChip(p: Property, chipId: string): boolean {
  const cat = (p.auto_category ?? "").toLowerCase();
  const fuel = (p.fuel_type ?? "").toLowerCase();
  const title = `${p.title ?? ""} ${p.model ?? ""}`.toLowerCase();

  switch (chipId) {
    case "car":
      return cat === "car";
    case "suv":
      return cat === "suv";
    case "pickup":
      return (
        cat === "truck" ||
        title.includes("pickup") ||
        title.includes("hilux") ||
        title.includes("ranger")
      );
    case "bus":
      return (
        cat === "van" ||
        cat === "commercial" ||
        title.includes("bus") ||
        title.includes("coaster")
      );
    case "motorcycle":
      return cat === "motorcycle";
    case "ev":
      return fuel === "electric" || fuel === "ev" || title.includes("electric");
    default:
      return true;
  }
}

export function quickChipsForCategory(
  category: HomeMarketplaceCategory,
): readonly QuickChip[] {
  return category === "vehicle" ? VEHICLE_QUICK_CHIPS : PROPERTY_QUICK_CHIPS;
}

/** Client-side rail filter for homepage quick chips (no navigation). */
export function filterListingsByQuickChip(
  items: Property[],
  category: HomeMarketplaceCategory,
  chipId: string | null,
): Property[] {
  if (!chipId) return items;
  return items.filter((p) =>
    category === "vehicle"
      ? matchesVehicleChip(p, chipId)
      : matchesPropertyChip(p, chipId),
  );
}

/** Search URL params when a quick chip should deepen into full search. */
export function searchParamsForQuickChip(
  category: HomeMarketplaceCategory,
  chipId: string,
): URLSearchParams {
  const params = new URLSearchParams();
  if (category === "vehicle") {
    if (chipId === "ev") {
      params.set("fuel", "electric");
    } else if (chipId === "bus") {
      params.set("category", "van");
    } else if (chipId === "pickup") {
      params.set("category", "truck");
    } else {
      params.set("category", chipId);
    }
    return params;
  }

  switch (chipId) {
    case "apartments":
      params.set("property_type", "flat");
      break;
    case "duplexes":
      params.set("property_type", "duplex");
      break;
    case "land":
      params.set("hub", "land_sale");
      break;
    case "commercial":
      params.set("property_type", "shop");
      break;
    case "shortlets":
      params.set("type", "shortlet");
      break;
    case "luxury":
      params.set("property_type", "mansion");
      break;
    default:
      break;
  }
  return params;
}
