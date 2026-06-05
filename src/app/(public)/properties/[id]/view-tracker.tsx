"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isDemoProperty } from "@/lib/mock-listings";
import { addRecentlyViewed } from "@/lib/recently-viewed";
import { formatPrice } from "@/lib/utils";
import type { Property } from "@/types/database";

export function PropertyViewTracker({
  propertyId,
  property,
}: {
  propertyId: string;
  property?: Pick<
    Property,
    "title" | "media_urls" | "city" | "area" | "price" | "payment_period" | "listing_type"
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
    }

    if (isDemoProperty(propertyId) || !isSupabaseConfigured()) return;
    const supabase = createClient();
    supabase.rpc("increment_property_views", { property_id: propertyId });
  }, [propertyId, property]);

  return null;
}
