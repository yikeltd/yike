import { ELECTRONICS_CATEGORIES } from "@/lib/marketplace/electronics-specs";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import type { DiscoverCategoryFilter } from "@/lib/discover/filters";

export type DiscoverCategoryOption = {
  id: DiscoverCategoryFilter;
  label: string;
  shortLabel: string;
  /** Lucide icon name hint for UI */
  icon: "layout-grid" | "home" | "car" | "smartphone";
  launchFeature?: "vehicle_marketplace" | "electronics_marketplace";
};

export type DiscoverElectronicsSubOption = {
  id: string;
  label: string;
};

const TOP_LEVEL: DiscoverCategoryOption[] = [
  {
    id: "all",
    label: "All categories",
    shortLabel: "All",
    icon: "layout-grid",
  },
  {
    id: "property",
    label: "Properties",
    shortLabel: "Properties",
    icon: "home",
  },
  {
    id: "vehicle",
    label: "Vehicles",
    shortLabel: "Vehicles",
    icon: "car",
    launchFeature: "vehicle_marketplace",
  },
  {
    id: "electronics",
    label: "Electronics",
    shortLabel: "Electronics",
    icon: "smartphone",
    launchFeature: "electronics_marketplace",
  },
];

/** Enabled top-level discover categories (respects launch gates). */
export function getDiscoverCategoryOptions(): DiscoverCategoryOption[] {
  return TOP_LEVEL.filter((opt) => {
    if (!opt.launchFeature) return true;
    return isLaunchFeatureVisible(opt.launchFeature);
  });
}

/** Popular electronics sub-types for discover filters (canonical `auto_category`). */
export function getDiscoverElectronicsSubOptions(): DiscoverElectronicsSubOption[] {
  if (!isLaunchFeatureVisible("electronics_marketplace")) return [];
  const highlight = new Set([
    "phones_tablets",
    "computers",
    "home_appliances",
    "tv_audio",
    "generators",
    "gaming",
  ]);
  return ELECTRONICS_CATEGORIES.filter((c) => highlight.has(c.id)).map((c) => ({
    id: c.id,
    label: c.label,
  }));
}

export function parseDiscoverCategoryParam(
  raw: string | string[] | null | undefined,
): DiscoverCategoryFilter {
  const value = (Array.isArray(raw) ? raw[0] : raw)?.trim().toLowerCase();
  if (!value || value === "all" || value === "mixed") return "all";
  if (value === "property" || value === "properties") return "property";
  if (value === "vehicle" || value === "vehicles") return "vehicle";
  if (
    value === "electronics" ||
    value === "electronic" ||
    value === "phones" ||
    value === "phones_tablets"
  ) {
    return "electronics";
  }
  return "all";
}

export function parseDiscoverElectronicsSubParam(
  raw: string | string[] | null | undefined,
): string {
  const value = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  if (!value) return "";
  const known = ELECTRONICS_CATEGORIES.some((c) => c.id === value);
  return known ? value : "";
}

export function discoverHref(options?: {
  category?: DiscoverCategoryFilter;
  electronicsSub?: string;
}): string {
  const params = new URLSearchParams();
  const category = options?.category ?? "all";
  if (category !== "all") params.set("category", category);
  if (options?.electronicsSub) params.set("electronics_sub", options.electronicsSub);
  const qs = params.toString();
  return qs ? `/discover?${qs}` : "/discover";
}

export function listingDiscoverCategoryLabel(assetType: string | null | undefined): string {
  const v = (assetType ?? "").toUpperCase();
  if (v === "VEHICLE" || v === "AUTO") return "Vehicle";
  if (v === "ELECTRONICS") return "Electronics";
  return "Property";
}
