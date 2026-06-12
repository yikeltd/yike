import type { ListingTypeValue } from "@/constants/listingTypes";
import {
  isCommercialProperty,
  isLandProperty,
} from "@/lib/listing-field-rules";

/** Room / area labels for listing photos and motion swipe story order. */
export const ROOM_LABELS = [
  "Exterior",
  "Parlor",
  "Living Room",
  "Kitchen",
  "Dining Area",
  "Master Bedroom",
  "Bedroom",
  "Bathroom",
  "Balcony",
  "Compound",
  "Parking Space",
  "Gate",
  "Street View",
  "Shop Front",
  "Office Space",
  "Land View",
  "Other",
] as const;

export type RoomLabel = (typeof ROOM_LABELS)[number];

/** Cinematic story order for swipe motion cards. Lower = earlier. */
export const ROOM_STORY_ORDER: Record<string, number> = {
  Exterior: 0,
  Gate: 1,
  "Street View": 2,
  Parlor: 3,
  "Living Room": 4,
  Kitchen: 5,
  "Dining Area": 6,
  "Master Bedroom": 7,
  Bedroom: 8,
  Bathroom: 9,
  Balcony: 10,
  Compound: 11,
  "Parking Space": 12,
  "Shop Front": 13,
  "Office Space": 14,
  "Land View": 15,
  Other: 99,
};

/** Default label suggestions when agent uploads in order. */
export const DEFAULT_UPLOAD_LABEL_SEQUENCE: RoomLabel[] = [
  "Exterior",
  "Parlor",
  "Kitchen",
  "Dining Area",
  "Master Bedroom",
  "Bedroom",
  "Bathroom",
  "Compound",
  "Other",
];

const LAND_UPLOAD_LABEL_SEQUENCE: RoomLabel[] = [
  "Land View",
  "Street View",
  "Gate",
  "Compound",
  "Exterior",
  "Other",
];

const COMMERCIAL_SHOP_UPLOAD_LABEL_SEQUENCE: RoomLabel[] = [
  "Shop Front",
  "Exterior",
  "Street View",
  "Office Space",
  "Compound",
  "Parking Space",
  "Other",
];

const COMMERCIAL_OFFICE_UPLOAD_LABEL_SEQUENCE: RoomLabel[] = [
  "Office Space",
  "Exterior",
  "Parking Space",
  "Compound",
  "Street View",
  "Other",
];

const SHORTLET_UPLOAD_LABEL_SEQUENCE: RoomLabel[] = [
  "Exterior",
  "Living Room",
  "Kitchen",
  "Master Bedroom",
  "Bathroom",
  "Balcony",
  "Other",
];

const LAND_PHOTO_LABELS: RoomLabel[] = [
  "Land View",
  "Street View",
  "Gate",
  "Compound",
  "Exterior",
  "Other",
];

const COMMERCIAL_PHOTO_LABELS: RoomLabel[] = [
  "Shop Front",
  "Office Space",
  "Exterior",
  "Street View",
  "Parking Space",
  "Compound",
  "Gate",
  "Other",
];

const SHORTLET_PHOTO_LABELS: RoomLabel[] = [
  "Exterior",
  "Living Room",
  "Kitchen",
  "Master Bedroom",
  "Bedroom",
  "Bathroom",
  "Balcony",
  "Compound",
  "Other",
];

const RESIDENTIAL_PHOTO_LABELS: RoomLabel[] = [
  "Exterior",
  "Parlor",
  "Living Room",
  "Kitchen",
  "Dining Area",
  "Master Bedroom",
  "Bedroom",
  "Bathroom",
  "Balcony",
  "Compound",
  "Parking Space",
  "Gate",
  "Other",
];

export function uploadLabelSequenceForContext(
  propertyType?: string,
  listingType?: ListingTypeValue
): RoomLabel[] {
  if (propertyType && isLandProperty(propertyType)) {
    return LAND_UPLOAD_LABEL_SEQUENCE;
  }
  if (propertyType && isCommercialProperty(propertyType)) {
    if (propertyType === "shop" || propertyType === "plaza") {
      return COMMERCIAL_SHOP_UPLOAD_LABEL_SEQUENCE;
    }
    return COMMERCIAL_OFFICE_UPLOAD_LABEL_SEQUENCE;
  }
  if (listingType === "shortlet") {
    return SHORTLET_UPLOAD_LABEL_SEQUENCE;
  }
  return DEFAULT_UPLOAD_LABEL_SEQUENCE;
}

export function photoLabelsForContext(
  propertyType?: string,
  listingType?: ListingTypeValue
): readonly RoomLabel[] {
  if (propertyType && isLandProperty(propertyType)) {
    return LAND_PHOTO_LABELS;
  }
  if (propertyType && isCommercialProperty(propertyType)) {
    return COMMERCIAL_PHOTO_LABELS;
  }
  if (listingType === "shortlet") {
    return SHORTLET_PHOTO_LABELS;
  }
  return RESIDENTIAL_PHOTO_LABELS;
}

/** Labels that should not be auto-selected as cover. */
export const POOR_COVER_LABELS = new Set<string>([
  "Bathroom",
  "Other",
  "Bedroom",
]);

/** Preferred cover labels. */
export const PREFERRED_COVER_LABELS = new Set<string>([
  "Exterior",
  "Gate",
  "Street View",
  "Parlor",
  "Living Room",
  "Land View",
  "Shop Front",
]);

export function storyOrderForLabel(label?: string | null): number {
  if (!label) return 50;
  return ROOM_STORY_ORDER[label] ?? 50;
}

export function suggestLabelForIndex(
  index: number,
  propertyType?: string,
  listingType?: ListingTypeValue
): RoomLabel {
  const sequence = uploadLabelSequenceForContext(propertyType, listingType);
  return sequence[index] ?? sequence[sequence.length - 1];
}

export function fallbackPhotoLabel(index: number): string {
  return `Photo ${index + 1}`;
}
