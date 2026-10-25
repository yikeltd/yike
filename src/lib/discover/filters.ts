import type { Property } from "@/types/database";
import { normalizeAssetType } from "@/lib/marketplace/listings";
import { isTrustVerified } from "@/lib/hub-filters";
import { isLandPropertyType } from "@/constants/listingTypes";

export type DiscoverCategoryFilter = "all" | "property" | "vehicle" | "electronics";

/** @deprecated Use DiscoverCategoryFilter */
export type DiscoverCategory = DiscoverCategoryFilter;

export type DiscoverDeal = "" | "sale" | "rent" | "land";

export type DiscoverFilterState = {
  category: DiscoverCategoryFilter;
  /** Electronics `auto_category` when filtering phones, computers, etc. */
  electronicsSub: string;
  deal: DiscoverDeal;
  state: string;
  city: string;
  maxBudget: number | null;
  featuredOnly: boolean;
  verifiedOnly: boolean;
};

export const DEFAULT_DISCOVER_FILTERS: DiscoverFilterState = {
  category: "all",
  electronicsSub: "",
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
    const isElectronics = asset === "ELECTRONICS";
    const isProperty = asset === "PROPERTY";

    if (filters.category === "property" && !isProperty) return false;
    if (filters.category === "vehicle" && !isVehicle) return false;
    if (filters.category === "electronics" && !isElectronics) return false;

    if (filters.electronicsSub) {
      if (!isElectronics) return false;
      if ((p.auto_category ?? "") !== filters.electronicsSub) return false;
    }

    if (
      filters.deal &&
      isProperty &&
      (filters.category === "property" || filters.category === "all")
    ) {
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
