import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ListingFeedParams,
  MarketplaceListingRow,
  SearchListingsResult,
} from "@/lib/search/types";
import { normalizeAssetType } from "@/lib/marketplace/listings";

const LISTING_SELECT = `
  id,
  title,
  description,
  price,
  asset_type,
  property_category,
  auto_category,
  condition,
  verification_status,
  state,
  city,
  images,
  attributes,
  moderation_status,
  is_active,
  is_featured,
  vendor_id,
  created_at,
  updated_at
`;

export type { ListingFeedParams };

/**
 * Marketplace feed over the `listings` SSOT view.
 * Falls back to empty on missing migration / view errors.
 */
export async function queryListingFeed(
  client: SupabaseClient,
  params: ListingFeedParams = {},
): Promise<SearchListingsResult> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(Math.max(params.limit ?? 12, 1), 48);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = client
    .from("listings")
    .select(LISTING_SELECT, { count: "exact" })
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (params.assetType) {
    const asset = normalizeAssetType(params.assetType);
    query = query.eq("asset_type", asset);
  }
  if (params.autoCategory) query = query.eq("auto_category", params.autoCategory);
  if (params.state) query = query.ilike("state", `%${params.state}%`);
  if (params.city) query = query.ilike("city", `%${params.city}%`);
  if (params.minPrice != null) query = query.gte("price", params.minPrice);
  if (params.maxPrice != null) query = query.lte("price", params.maxPrice);
  if (params.q) {
    query = query.or(
      `title.ilike.%${params.q}%,description.ilike.%${params.q}%,city.ilike.%${params.q}%`,
    );
  }
  if (params.moderationApprovedOnly !== false) {
    query = query.eq("moderation_status", "approved");
  }
  if (params.equipmentType) {
    query = query.contains("attributes", { equipment_type: params.equipmentType });
  }

  const { data, count, error } = await query;
  if (error) {
    return { items: [], total: 0, page, limit, hasMore: false };
  }

  const items = ((data ?? []) as MarketplaceListingRow[]).map((row) => ({
    ...row,
    asset_type: normalizeAssetType(row.asset_type),
  }));
  const total = count ?? items.length;

  return {
    items,
    total,
    page,
    limit,
    hasMore: from + items.length < total,
  };
}
