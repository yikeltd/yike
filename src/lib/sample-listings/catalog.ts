/**
 * Exactly 90 handcrafted sample listings (30 property · 30 vehicle · 30 electronics).
 * Regenerate listing arrays: npx tsx scripts/generate-ninety-sample-catalog.ts
 */

export {
  SAMPLE_LISTINGS_NAMESPACE,
  SAMPLE_PROPERTY_PHOTOS,
  SAMPLE_VEHICLE_PHOTOS,
  SAMPLE_ELECTRONICS_PHOTOS,
  SAMPLE_SELLERS,
  sampleListingId,
  pickPhotos,
  type SampleSellerDef,
} from "./catalog-shared";

export type {
  SamplePropertyDef,
  SampleVehicleDef,
  SampleElectronicsDef,
} from "./catalog-types";

export {
  SAMPLE_PROPERTIES,
  SAMPLE_VEHICLES,
  SAMPLE_ELECTRONICS,
} from "./catalog-listings.generated";

import {
  SAMPLE_PROPERTIES,
  SAMPLE_VEHICLES,
  SAMPLE_ELECTRONICS,
} from "./catalog-listings.generated";

export function sampleListingCounts() {
  return {
    properties: SAMPLE_PROPERTIES.length,
    vehicles: SAMPLE_VEHICLES.length,
    electronics: SAMPLE_ELECTRONICS.length,
    total:
      SAMPLE_PROPERTIES.length +
      SAMPLE_VEHICLES.length +
      SAMPLE_ELECTRONICS.length,
  };
}
