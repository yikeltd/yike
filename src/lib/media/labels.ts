/**
 * @deprecated Prefer `resolvePhotoSchema` / category manifests.
 * Thin compatibility layer over the listing-engine photo schemas.
 */
import type { ListingTypeValue } from "@/constants/listingTypes";
import {
  PROPERTY_COMMERCIAL_PHOTO_SCHEMA,
  PROPERTY_LAND_PHOTO_SCHEMA,
  PROPERTY_RESIDENTIAL_PHOTO_SCHEMA,
  PROPERTY_SHORTLET_PHOTO_SCHEMA,
  VEHICLE_PHOTO_SCHEMA,
  resolvePropertyPhotoSchema,
  schemaLabels,
  suggestLabelFromSchema,
  preferredCoverLabelSet,
  poorCoverLabelSet,
  storyOrderForSchemaLabel,
} from "@/lib/listing-engine/photo-schema";

/** @deprecated Use schemaLabels(resolvePhotoSchema(...)) */
export const ROOM_LABELS = [
  ...new Set([
    ...schemaLabels(PROPERTY_RESIDENTIAL_PHOTO_SCHEMA),
    ...schemaLabels(PROPERTY_LAND_PHOTO_SCHEMA),
    ...schemaLabels(PROPERTY_COMMERCIAL_PHOTO_SCHEMA),
    ...schemaLabels(PROPERTY_SHORTLET_PHOTO_SCHEMA),
    ...schemaLabels(VEHICLE_PHOTO_SCHEMA),
  ]),
] as string[];

export type RoomLabel = string;

/** @deprecated Prefer storyOrderForSchemaLabel(schema, label) */
export const ROOM_STORY_ORDER: Record<string, number> = Object.fromEntries(
  [
    PROPERTY_RESIDENTIAL_PHOTO_SCHEMA,
    PROPERTY_LAND_PHOTO_SCHEMA,
    PROPERTY_COMMERCIAL_PHOTO_SCHEMA,
    VEHICLE_PHOTO_SCHEMA,
  ].flatMap((schema) =>
    schema.tags.map((t) => [t.label, schema.storyOrder[t.id] ?? 50] as const)
  )
);

export const DEFAULT_UPLOAD_LABEL_SEQUENCE = PROPERTY_RESIDENTIAL_PHOTO_SCHEMA.uploadSequence.map(
  (id) =>
    PROPERTY_RESIDENTIAL_PHOTO_SCHEMA.tags.find((t) => t.id === id)?.label ?? "Other"
);

export function uploadLabelSequenceForContext(
  propertyType?: string,
  listingType?: ListingTypeValue
): string[] {
  const schema = resolvePropertyPhotoSchema({ propertyType, listingType });
  return schema.uploadSequence.map(
    (id) => schema.tags.find((t) => t.id === id)?.label ?? "Other"
  );
}

export function photoLabelsForContext(
  propertyType?: string,
  listingType?: ListingTypeValue
): readonly string[] {
  return schemaLabels(resolvePropertyPhotoSchema({ propertyType, listingType }));
}

/** Union of poor covers across schemas — soft quality only. */
export const POOR_COVER_LABELS = new Set<string>([
  ...poorCoverLabelSet(PROPERTY_RESIDENTIAL_PHOTO_SCHEMA),
  ...poorCoverLabelSet(PROPERTY_LAND_PHOTO_SCHEMA),
  ...poorCoverLabelSet(PROPERTY_COMMERCIAL_PHOTO_SCHEMA),
  ...poorCoverLabelSet(VEHICLE_PHOTO_SCHEMA),
]);

/** Union of preferred covers across schemas — soft quality only. */
export const PREFERRED_COVER_LABELS = new Set<string>([
  ...preferredCoverLabelSet(PROPERTY_RESIDENTIAL_PHOTO_SCHEMA),
  ...preferredCoverLabelSet(PROPERTY_LAND_PHOTO_SCHEMA),
  ...preferredCoverLabelSet(PROPERTY_COMMERCIAL_PHOTO_SCHEMA),
  ...preferredCoverLabelSet(VEHICLE_PHOTO_SCHEMA),
  // Legacy labels still present on older listings
  "Exterior",
  "Gate",
  "Street View",
  "Parlor",
  "Land View",
]);

export function storyOrderForLabel(label?: string | null): number {
  if (!label) return 50;
  for (const schema of [
    PROPERTY_RESIDENTIAL_PHOTO_SCHEMA,
    PROPERTY_LAND_PHOTO_SCHEMA,
    PROPERTY_COMMERCIAL_PHOTO_SCHEMA,
    VEHICLE_PHOTO_SCHEMA,
  ]) {
    const order = storyOrderForSchemaLabel(schema, label);
    if (schema.tags.some((t) => t.label === label)) return order;
  }
  return ROOM_STORY_ORDER[label] ?? 50;
}

export function suggestLabelForIndex(
  index: number,
  propertyType?: string,
  listingType?: ListingTypeValue
): string {
  return suggestLabelFromSchema(
    resolvePropertyPhotoSchema({ propertyType, listingType }),
    index
  );
}

export function fallbackPhotoLabel(index: number): string {
  return `Photo ${index + 1}`;
}
