"use client";

import { useEffect } from "react";
import { addRecentlyViewed } from "@/lib/recently-viewed";
import { listingPath } from "@/lib/marketplace/listing-path";
import type { AssetType } from "@/types/database";

export function MarketplaceViewTracker({
  id,
  title,
  image,
  city,
  area,
  priceLabel,
  assetType,
  slug,
}: {
  id: string;
  title: string;
  image: string;
  city: string;
  area: string;
  priceLabel: string;
  assetType: AssetType;
  slug?: string | null;
}) {
  useEffect(() => {
    addRecentlyViewed({
      id,
      title,
      image,
      city,
      area,
      priceLabel,
      assetType,
      href: listingPath({ id, slug: slug ?? null, asset_type: assetType }),
    });
  }, [id, title, image, city, area, priceLabel, assetType, slug]);

  return null;
}
