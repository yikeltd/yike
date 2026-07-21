import type { AssetType } from "@/types/database";
import type { PropertySearchParams } from "@/lib/properties";

export type MarketplaceListingRow = {
  id: string;
  title: string;
  description?: string;
  price: number;
  asset_type: AssetType;
  property_category?: string | null;
  auto_category?: string | null;
  condition?: string | null;
  verification_status?: string;
  state: string;
  city: string;
  images?: string[];
  attributes?: Record<string, unknown>;
  moderation_status?: string;
  is_active?: boolean;
  is_featured?: boolean;
  vendor_id?: string;
  created_at?: string;
  updated_at?: string;
};

export type ListingFeedParams = {
  page?: number;
  limit?: number;
  assetType?: AssetType;
  autoCategory?: string | null;
  equipmentType?: string | null;
  state?: string;
  city?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  moderationApprovedOnly?: boolean;
};

export type SearchListingsParams = ListingFeedParams;

export type SearchListingsResult = {
  items: MarketplaceListingRow[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

export type SearchPropertiesParams = PropertySearchParams & {
  limit?: number;
};

export type SearchPropertiesResult = {
  items: Awaited<ReturnType<typeof import("@/lib/properties").getPublicProperties>>;
  total: number;
};

export type SearchVehiclesParams = Omit<SearchListingsParams, "assetType"> & {
  autoCategory?: string;
};

export type SearchMachineryParams = Omit<SearchListingsParams, "assetType"> & {
  autoCategory?: string;
  equipmentType?: string | null;
};
