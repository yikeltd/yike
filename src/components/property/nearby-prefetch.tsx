"use client";

import { useEffect } from "react";
import type { Property } from "@/types/database";
import { prefetchListingImages } from "@/lib/image-prefetch";

/** Warm thumbnails for related listings on detail pages. */
export function NearbyPrefetch({ properties }: { properties: Property[] }) {
  useEffect(() => {
    prefetchListingImages(
      properties
        .slice(0, 4)
        .map((p) => p.media_urls[0])
        .filter(Boolean) as string[],
      480
    );
  }, [properties]);

  return null;
}
