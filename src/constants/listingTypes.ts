import type { PropertyCategoryGroup } from "@/constants/propertyCategories";
import { getCategoriesByGroup } from "@/constants/propertyCategories";

/** How the deal is structured — rent, lease, purchase, or short stay */
export type ListingTypeValue = "rent" | "lease" | "sale" | "shortlet";

export type ListingTypeConfig = {
  value: ListingTypeValue;
  label: string;
  searchLabel: string;
  description: string;
  defaultPaymentPeriod: "yearly" | "monthly" | "weekly" | "daily" | "total";
  propertyGroups: PropertyCategoryGroup[];
};

export const LISTING_TYPE_CONFIG: Record<ListingTypeValue, ListingTypeConfig> = {
  rent: {
    value: "rent",
    label: "Rent",
    searchLabel: "Rent",
    description: "Houses, flats & rooms for rent",
    defaultPaymentPeriod: "yearly",
    propertyGroups: ["residential", "commercial", "student"],
  },
  lease: {
    value: "lease",
    label: "Lease",
    searchLabel: "Lease",
    description: "Land lease, commercial & long-term lease",
    defaultPaymentPeriod: "yearly",
    propertyGroups: ["land", "commercial", "residential"],
  },
  sale: {
    value: "sale",
    label: "Buy",
    searchLabel: "Buy",
    description: "Land, houses & property for sale",
    defaultPaymentPeriod: "total",
    propertyGroups: ["land", "residential", "commercial"],
  },
  shortlet: {
    value: "shortlet",
    label: "Shortlet",
    searchLabel: "Shortlet",
    description: "Nightly & weekly furnished stays",
    defaultPaymentPeriod: "daily",
    propertyGroups: ["shortlet", "residential"],
  },
};

export const LISTING_TYPES = Object.values(LISTING_TYPE_CONFIG).map(
  ({ value, label }) => ({ value, label })
);

/** Consumer search chips — All shows every deal type including lease */
export const SEARCH_DEAL_TYPES = [
  { value: "", label: "All" },
  { value: "rent", label: "Rent" },
  { value: "sale", label: "Buy" },
  { value: "shortlet", label: "Shortlet" },
] as const;

export type SearchDealType = (typeof SEARCH_DEAL_TYPES)[number]["value"];

const LAND_TYPES = new Set([
  "land",
  "land_residential",
  "land_commercial",
  "land_farm",
]);

export function isLandPropertyType(value: string | null | undefined): boolean {
  if (!value) return false;
  return LAND_TYPES.has(value) || value.startsWith("land_");
}

export function propertyTypesForListingType(listingType: string) {
  const config =
    LISTING_TYPE_CONFIG[listingType as ListingTypeValue] ??
    LISTING_TYPE_CONFIG.rent;
  return config.propertyGroups.flatMap((group) =>
    getCategoriesByGroup(group).map((c) => ({
      value: c.value,
      label: c.label,
      group,
    }))
  );
}

export function defaultPaymentPeriodForListingType(
  listingType: string
): ListingTypeConfig["defaultPaymentPeriod"] {
  return (
    LISTING_TYPE_CONFIG[listingType as ListingTypeValue]?.defaultPaymentPeriod ??
    "yearly"
  );
}

export function hubLabel(hub: string): string | null {
  const labels: Record<string, string> = {
    student: "Student housing",
    affordable: "Affordable rent",
    shortlet: "Shortlets",
    land_sale: "Land for sale",
    land_lease: "Land for lease",
    buy: "Homes for sale",
    lease: "Property lease",
  };
  return labels[hub] ?? null;
}
