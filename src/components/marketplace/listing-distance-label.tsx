"use client";

import { useEffect, useState } from "react";
import {
  getMarketplaceLocation,
  listingDistanceLabel,
} from "@/lib/marketplace-location";

/** Client-only distance chip from preferred location → listing city centroid. */
export function ListingDistanceLabel({
  city,
  state,
  className,
}: {
  city?: string | null;
  state?: string | null;
  className?: string;
}) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const loc = getMarketplaceLocation();
    if (!loc?.lat && !loc?.city) {
      setLabel(null);
      return;
    }
    setLabel(listingDistanceLabel({ city, state }, loc));
  }, [city, state]);

  if (!label) return null;
  return <span className={className}>{label}</span>;
}
