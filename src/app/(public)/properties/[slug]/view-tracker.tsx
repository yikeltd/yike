"use client";

import { useEffect } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isDemoProperty } from "@/lib/mock-listings";
import { addRecentlyViewed } from "@/lib/recently-viewed";
import { trackViewedListing } from "@/lib/browse-preferences";
import { cachePageForOffline } from "@/lib/pwa/cache";
import { formatPrice } from "@/lib/utils";
import type { Property } from "@/types/database";

export function PropertyViewTracker({
  propertyId,
  property,
  slug,
}: {
  propertyId: string;
  slug?: string;
  property?: Pick<
    Property,
    | "title"
    | "media_urls"
    | "city"
    | "area"
    | "price"
    | "payment_period"
    | "listing_type"
    | "property_type"
  >;
}) {
  useEffect(() => {
    if (property) {
      addRecentlyViewed({
        id: propertyId,
        title: property.title,
        image: property.media_urls[0] ?? "/placeholder-property.svg",
        city: property.city,
        area: property.area,
        priceLabel: formatPrice(
          Number(property.price),
          property.payment_period,
          property.listing_type
        ),
      });
      trackViewedListing(propertyId, {
        city: property.city,
        area: property.area,
        listingType: property.listing_type,
        propertyType: property.property_type,
      });
      cachePageForOffline(
        slug ? `/properties/${slug}` : `/properties/${propertyId}`
      );
    }

    if (isDemoProperty(propertyId) || !isSupabaseConfigured()) return;
    void fetch(`/api/properties/${encodeURIComponent(propertyId)}/view`, {
      method: "POST",
      keepalive: true,
    });
  }, [propertyId, property, slug]);

  return null;
}
