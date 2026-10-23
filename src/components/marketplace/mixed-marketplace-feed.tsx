"use client";

import type { Property } from "@/types/database";
import { normalizeAssetType } from "@/lib/marketplace/listings";
import { BROWSE_GRID_CLASS } from "@/lib/marketplace/browse-grid";
import { PropertyCard } from "@/components/property/property-card";
import { VehicleCard } from "@/components/marketplace/vehicle-card";
import { ElectronicsCard } from "@/components/marketplace/electronics-card";

export function MixedMarketplaceFeed({ listings }: { listings: Property[] }) {
  return (
    <ul className={BROWSE_GRID_CLASS}>
      {listings.map((listing) => {
        const asset = normalizeAssetType(listing.asset_type);
        if (asset === "VEHICLE") {
          return (
            <li key={listing.id}>
              <VehicleCard vehicle={listing} variant="browse" />
            </li>
          );
        }
        if (asset === "ELECTRONICS") {
          return (
            <li key={listing.id}>
              <ElectronicsCard listing={listing} />
            </li>
          );
        }
        return (
          <li key={listing.id}>
            <PropertyCard property={listing} />
          </li>
        );
      })}
    </ul>
  );
}
