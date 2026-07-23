import type { HomeMarketplaceCategory } from "@/lib/home/marketplace-category";

export type MarketplaceTrendLink = {
  id: string;
  label: string;
  href: string;
};

export type FeaturedLocationLink = {
  id: string;
  label: string;
  href: string;
};

/** Hardcoded high-intent queries — category-scoped, link to filtered search. */
export const PROPERTY_TRENDING_SEARCHES: readonly MarketplaceTrendLink[] = [
  {
    id: "lekki-2bed",
    label: "2 bed in Lekki",
    href: "/search?city=Lagos&area=Lekki&property_type=flat_2",
  },
  {
    id: "abuja-rent",
    label: "Rent in Abuja",
    href: "/search?city=Abuja&type=rent",
  },
  {
    id: "ph-duplex",
    label: "Duplexes in PH",
    href: "/search?city=Port+Harcourt&property_type=duplex",
  },
  {
    id: "enugu-land",
    label: "Land in Enugu",
    href: "/search?state=Enugu&hub=land_sale",
  },
  {
    id: "lagos-shortlet",
    label: "Short lets Lagos",
    href: "/search?city=Lagos&type=shortlet",
  },
  {
    id: "ibadan-buy",
    label: "Buy in Ibadan",
    href: "/search?city=Ibadan&type=sale",
  },
] as const;

export const VEHICLE_TRENDING_SEARCHES: readonly MarketplaceTrendLink[] = [
  {
    id: "toyota-camry",
    label: "Toyota Camry",
    href: "/vehicles?make=Toyota&model=Camry",
  },
  {
    id: "suv-lagos",
    label: "SUVs in Lagos",
    href: "/vehicles?category=suv&state=Lagos",
  },
  {
    id: "honda-accord",
    label: "Honda Accord",
    href: "/vehicles?make=Honda&model=Accord",
  },
  {
    id: "abuja-cars",
    label: "Cars in Abuja",
    href: "/vehicles?category=car&state=FCT",
  },
  {
    id: "pickups",
    label: "Pickups",
    href: "/vehicles?category=truck",
  },
  {
    id: "mercedes",
    label: "Mercedes-Benz",
    href: "/vehicles?make=Mercedes-Benz",
  },
] as const;

export const PROPERTY_FEATURED_LOCATIONS: readonly FeaturedLocationLink[] = [
  { id: "lagos", label: "Lagos", href: "/houses/lagos" },
  { id: "abuja", label: "Abuja", href: "/houses/abuja" },
  {
    id: "ph",
    label: "Port Harcourt",
    href: "/houses/port-harcourt",
  },
  { id: "enugu", label: "Enugu", href: "/search?state=Enugu" },
  { id: "ibadan", label: "Ibadan", href: "/search?city=Ibadan" },
  { id: "owerri", label: "Owerri", href: "/search?city=Owerri" },
] as const;

export const VEHICLE_FEATURED_LOCATIONS: readonly FeaturedLocationLink[] = [
  { id: "lagos", label: "Lagos", href: "/vehicles?state=Lagos" },
  { id: "abuja", label: "Abuja", href: "/vehicles?state=FCT" },
  {
    id: "ph",
    label: "Port Harcourt",
    href: "/vehicles?state=Rivers",
  },
  { id: "kano", label: "Kano", href: "/vehicles?state=Kano" },
  { id: "ibadan", label: "Ibadan", href: "/vehicles?state=Oyo" },
  { id: "enugu", label: "Enugu", href: "/vehicles?state=Enugu" },
] as const;

export function trendingSearchesForCategory(
  category: HomeMarketplaceCategory,
): readonly MarketplaceTrendLink[] {
  return category === "vehicle"
    ? VEHICLE_TRENDING_SEARCHES
    : PROPERTY_TRENDING_SEARCHES;
}

export function featuredLocationsForCategory(
  category: HomeMarketplaceCategory,
): readonly FeaturedLocationLink[] {
  return category === "vehicle"
    ? VEHICLE_FEATURED_LOCATIONS
    : PROPERTY_FEATURED_LOCATIONS;
}
