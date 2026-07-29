import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Advertisement, Property } from "@/types/database";
import type { AdvertisementPlacement } from "@/lib/advertisements/constants";
import { getSponsoredAd } from "@/lib/advertisements/public";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";

export type PlacementContentType = "ad" | "featured" | "organic" | "none";

export type PlacementContentResult =
  | { type: "ad"; ad: Advertisement }
  | { type: "featured"; listing: Property }
  | { type: "organic"; listing: Property }
  | { type: "none"; ad: null; listing: null };

export const getPlacementContent = cache(
  async (
    placement: AdvertisementPlacement,
    options?: {
      category?: string;
      city?: string;
      excludeListingId?: string;
    }
  ): Promise<PlacementContentResult> => {
    // 1. Try resolving paid active advertisement
    const ad = await getSponsoredAd(placement);
    if (ad && ad.image_url?.trim()) {
      return { type: "ad", ad };
    }

    if (!isAdminClientConfigured()) {
      return { type: "none", ad: null, listing: null };
    }

    const admin = createAdminClient();
    if (!admin) {
      return { type: "none", ad: null, listing: null };
    }

    // 2. Fallback to featured listing if available
    try {
      let query = admin
        .from("listings")
        .select("*")
        .eq("status", "active")
        .eq("is_featured", true)
        .order("featured_until", { ascending: false, nullsFirst: false })
        .limit(1);

      if (options?.category) {
        query = query.eq("category", options.category);
      }
      if (options?.city) {
        query = query.eq("city", options.city);
      }
      if (options?.excludeListingId) {
        query = query.neq("id", options.excludeListingId);
      }

      const { data: featuredData } = await query.maybeSingle();
      if (featuredData) {
        return { type: "featured", listing: featuredData as Property };
      }
    } catch {
      /* ignore */
    }

    // 3. Fallback to organic recommendation
    try {
      let organicQuery = admin
        .from("listings")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1);

      if (options?.category) {
        organicQuery = organicQuery.eq("category", options.category);
      }
      if (options?.excludeListingId) {
        organicQuery = organicQuery.neq("id", options.excludeListingId);
      }

      const { data: organicData } = await organicQuery.maybeSingle();
      if (organicData) {
        return { type: "organic", listing: organicData as Property };
      }
    } catch {
      /* ignore */
    }

    // 4. Zero layout shift fallback
    return { type: "none", ad: null, listing: null };
  }
);
