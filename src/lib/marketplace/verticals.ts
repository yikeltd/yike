/**
 * Marketplace vertical registry — category-driven platform foundation.
 * Future verticals are declared here as reserved; do not implement product UI yet.
 */

export type MarketplaceVerticalId =
  | "property"
  | "vehicle"
  | "jobs"
  | "services"
  | "equipment"
  | "agriculture"
  | "hospitality"
  | "rentals"
  | "marine"
  | "aviation"
  | "businesses"
  | "digital_assets";

export type MarketplaceVerticalStatus =
  | "live"
  | "launching"
  | "reserved"
  | "disabled";

export type MarketplaceVertical = {
  id: MarketplaceVerticalId;
  /** DB asset_type value */
  assetType: "PROPERTY" | "VEHICLE" | "FUTURE";
  label: string;
  pluralLabel: string;
  href: string;
  createHref: string;
  status: MarketplaceVerticalStatus;
  /** launch-mode feature key when gated */
  launchFeature?:
    | "vehicle_marketplace"
    | "industrial_marketplace"
    | "hospitality_listings"
    | "business_listings";
  description: string;
};

export const MARKETPLACE_VERTICALS: MarketplaceVertical[] = [
  {
    id: "property",
    assetType: "PROPERTY",
    label: "Property",
    pluralLabel: "Properties",
    href: "/search",
    createHref: "/agent/listings/new",
    status: "live",
    description: "Find your next home.",
  },
  {
    id: "vehicle",
    assetType: "VEHICLE",
    label: "Vehicle",
    pluralLabel: "Vehicles",
    href: "/vehicles",
    createHref: "/agent/listings/new/vehicle",
    status: "launching",
    launchFeature: "vehicle_marketplace",
    description: "Find your next vehicle.",
  },
  {
    id: "jobs",
    assetType: "FUTURE",
    label: "Jobs",
    pluralLabel: "Jobs",
    href: "/jobs",
    createHref: "/jobs/new",
    status: "reserved",
    description: "Find your next role.",
  },
  {
    id: "services",
    assetType: "FUTURE",
    label: "Services",
    pluralLabel: "Services",
    href: "/services-market",
    createHref: "/services-market/new",
    status: "reserved",
    description: "Find trusted services.",
  },
  {
    id: "equipment",
    assetType: "FUTURE",
    label: "Equipment",
    pluralLabel: "Equipment",
    href: "/equipment",
    createHref: "/equipment/new",
    status: "reserved",
    description: "Find equipment.",
  },
  {
    id: "agriculture",
    assetType: "FUTURE",
    label: "Agriculture",
    pluralLabel: "Agriculture",
    href: "/agriculture",
    createHref: "/agriculture/new",
    status: "reserved",
    description: "Find agriculture listings.",
  },
  {
    id: "hospitality",
    assetType: "FUTURE",
    label: "Hospitality",
    pluralLabel: "Hospitality",
    href: "/hospitality",
    createHref: "/hospitality/new",
    status: "reserved",
    launchFeature: "hospitality_listings",
    description: "Find stays and hospitality.",
  },
  {
    id: "rentals",
    assetType: "FUTURE",
    label: "Rentals",
    pluralLabel: "Rentals",
    href: "/rentals",
    createHref: "/rentals/new",
    status: "reserved",
    description: "Find rentals.",
  },
  {
    id: "marine",
    assetType: "FUTURE",
    label: "Marine",
    pluralLabel: "Marine",
    href: "/marine",
    createHref: "/marine/new",
    status: "reserved",
    description: "Find marine listings.",
  },
  {
    id: "aviation",
    assetType: "FUTURE",
    label: "Aviation",
    pluralLabel: "Aviation",
    href: "/aviation",
    createHref: "/aviation/new",
    status: "reserved",
    description: "Find aviation listings.",
  },
  {
    id: "businesses",
    assetType: "FUTURE",
    label: "Businesses",
    pluralLabel: "Businesses",
    href: "/businesses",
    createHref: "/businesses/new",
    status: "reserved",
    launchFeature: "business_listings",
    description: "Find businesses.",
  },
  {
    id: "digital_assets",
    assetType: "FUTURE",
    label: "Digital Assets",
    pluralLabel: "Digital Assets",
    href: "/digital-assets",
    createHref: "/digital-assets/new",
    status: "reserved",
    description: "Find digital assets.",
  },
];

export function getVertical(id: MarketplaceVerticalId): MarketplaceVertical | undefined {
  return MARKETPLACE_VERTICALS.find((v) => v.id === id);
}

export function getLiveVerticals(): MarketplaceVertical[] {
  return MARKETPLACE_VERTICALS.filter(
    (v) => v.status === "live" || v.status === "launching",
  );
}

export function verticalFromAssetType(
  assetType: string | null | undefined,
): MarketplaceVerticalId {
  if (assetType === "VEHICLE" || assetType === "AUTO") return "vehicle";
  return "property";
}
