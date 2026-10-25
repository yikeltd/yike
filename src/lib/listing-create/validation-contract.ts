import {
  ELECTRONICS_PHOTO_RULES,
  PROPERTY_PHOTO_RULES,
  VEHICLE_PHOTO_RULES,
} from "@/lib/listing-engine/photo-schema/rules";
import type { PhotoRules } from "@/lib/listing-engine/types";
import {
  LISTING_CREATE_MAX_PHOTOS,
  LISTING_CREATE_MIN_PHOTOS,
} from "@/lib/listing-create/constants";
import { ELECTRONICS_CREATE_MIN_PHOTOS } from "@/lib/listing-create/electronics-body";
import { VEHICLE_CREATE_MIN_PHOTOS } from "@/lib/listing-create/vehicle-body";

export function assertPhotoRulesMatchCreateContract(rules: PhotoRules): boolean {
  return rules.min === LISTING_CREATE_MIN_PHOTOS && rules.max === LISTING_CREATE_MAX_PHOTOS;
}

/** Regression guard: manifest photo mins/maxes match server parsers. */
export function listingCreateValidationContractSnapshot() {
  return {
    minPhotos: LISTING_CREATE_MIN_PHOTOS,
    maxPhotos: LISTING_CREATE_MAX_PHOTOS,
    propertyPhotoRules: PROPERTY_PHOTO_RULES,
    vehiclePhotoRules: VEHICLE_PHOTO_RULES,
    electronicsPhotoRules: ELECTRONICS_PHOTO_RULES,
    vehicleParserMin: VEHICLE_CREATE_MIN_PHOTOS,
    electronicsParserMin: ELECTRONICS_CREATE_MIN_PHOTOS,
  };
}

export function allVerticalPhotoRulesAlignWithServer(): boolean {
  const snap = listingCreateValidationContractSnapshot();
  return (
    assertPhotoRulesMatchCreateContract(snap.propertyPhotoRules) &&
    assertPhotoRulesMatchCreateContract(snap.vehiclePhotoRules) &&
    assertPhotoRulesMatchCreateContract(snap.electronicsPhotoRules) &&
    snap.vehicleParserMin === LISTING_CREATE_MIN_PHOTOS &&
    snap.electronicsParserMin === LISTING_CREATE_MIN_PHOTOS
  );
}
