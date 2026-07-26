import type { Property } from "@/types/database";
import { normalizeAssetType } from "@/lib/marketplace/listings";
import { isTrustVerified } from "@/lib/hub-filters";
import { isLandPropertyType } from "@/constants/listingTypes";

export type DiscoverCategory = "property" | "vehicle";

export type DiscoverDeal = "" | "sale" | "rent" | "land";

export type DiscoverFilterState = {
  category: DiscoverCategory;
  deal: DiscoverDeal;
  state: string;
  city: string;
  maxBudget: number | null;
  featuredOnly: boolean;
  verifiedOnly: boolean;
};

export const DEFAULT_DISCOVER_FILTERS: DiscoverFilterState = {
  category: "property",
  deal: "",
  state: "",
  city: "",
  maxBudget: null,
  featuredOnly: false,
  verifiedOnly: false,
};

export function applyDiscoverFilters(
  items: Property[],
  filters: DiscoverFilterState,
): Property[] {
  return items.filter((p) => {
    const asset = normalizeAssetType(p.asset_type);
    const isVehicle = asset === "VEHICLE";

    if (filters.category === "property" && isVehicle) return false;
    if (filters.category === "vehicle" && !isVehicle) return false;

    if (filters.category === "property" && filters.deal) {
      if (filters.deal === "land") {
        if (!isLandPropertyType(p.property_type)) return false;
      } else if (filters.deal === "sale") {
        if (p.listing_type !== "sale") return false;
      } else if (filters.deal === "rent") {
        if (p.listing_type !== "rent" && p.listing_type !== "shortlet") {
          return false;
        }
      }
    }

    if (filters.state) {
      const state = (p.state ?? "").toLowerCase();
      if (!state.includes(filters.state.toLowerCase())) return false;
    }

    if (filters.city) {
      if (p.city.toLowerCase() !== filters.city.toLowerCase()) return false;
    }

    if (filters.maxBudget != null && Number(p.price) > filters.maxBudget) {
      return false;
    }

    if (filters.featuredOnly && !p.is_featured) return false;
    if (filters.verifiedOnly && !isTrustVerified(p)) return false;

    return true;
  });
}
