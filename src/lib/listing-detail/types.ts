import type { AssetType } from "@/types/database";

export type ListingDetailSectionId =
  | "hero_gallery"
  | "video"
  | "tour_360"
  | "trust_panel"
  | "verification"
  | "seller"
  | "organization"
  | "branch"
  | "market_value"
  | "price_history"
  | "timeline"
  | "nearby_listings"
  | "nearby_schools"
  | "nearby_hospitals"
  | "nearby_banks"
  | "transportation"
  | "neighbourhood_score"
  | "walkability"
  | "inspection_history"
  | "market_insights"
  | "mortgage_calculator"
  | "insurance"
  | "similar_listings"
  | "recently_viewed"
  | "actions_bar";

export type ListingDetailSectionStatus = "active" | "future" | "hidden";

export type ListingDetailManifestSection = {
  id: ListingDetailSectionId;
  title: string;
  subtitle?: string;
  status: ListingDetailSectionStatus;
  priority: number;
  cacheTtlSeconds: number;
  assetTypes?: AssetType[];
};
