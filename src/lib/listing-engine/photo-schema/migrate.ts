/**
 * Map legacy / cross-category labels onto the active photo schema.
 * Never drop photos — unknown labels become Other.
 */
import type { PhotoSchema } from "./types";
import { schemaLabelById, schemaTagByLabel } from "./helpers";

/** Canonical aliases → preferred modern label text (before schema lookup). */
const LEGACY_ALIAS: Record<string, string> = {
  exterior: "Front View",
  parlor: "Living Room",
  "living room": "Living Room",
  kitchen: "Kitchen",
  "dining area": "Dining Area",
  "master bedroom": "Master Bedroom",
  bedroom: "Bedroom",
  bathroom: "Bathroom",
  balcony: "Balcony",
  compound: "Compound",
  "parking space": "Parking",
  parking: "Parking",
  gate: "Front View",
  "street view": "Access Road",
  "shop front": "Shop Front",
  "office space": "Office Space",
  "land view": "Front View",
  front: "Exterior Front",
  rear: "Exterior Rear",
  interior: "Interior Front",
  dashboard: "Dashboard",
  engine: "Engine",
  tyres: "Tyres",
  tires: "Tyres",
  documents: "Other",
};

/** Schema-specific remaps when a legacy label is valid elsewhere but wrong here. */
const SCHEMA_REMAP: Record<string, Record<string, string>> = {
  vehicle: {
    "Front View": "Exterior Front",
    Exterior: "Exterior Front",
    Compound: "Other",
    Kitchen: "Other",
    Bedroom: "Other",
    Bathroom: "Other",
    "Living Room": "Interior Front",
    Parlor: "Interior Front",
    "Dining Area": "Other",
    "Master Bedroom": "Other",
    Balcony: "Other",
    Parking: "Other",
    "Shop Front": "Exterior Front",
    "Office Space": "Other",
    "Land View": "Exterior Front",
    Gate: "Exterior Front",
    "Street View": "Exterior Front",
    Boundary: "Other",
    "Access Road": "Other",
    "Survey Plan": "Other",
  },
  "property.land": {
    Exterior: "Front View",
    "Exterior Front": "Front View",
    Gate: "Boundary",
    "Street View": "Access Road",
    "Land View": "Front View",
    Compound: "Neighborhood",
    Kitchen: "Other",
    Bedroom: "Other",
    Bathroom: "Other",
    "Living Room": "Other",
    Parlor: "Other",
    Engine: "Other",
    Dashboard: "Other",
    Tyres: "Other",
  },
  "property.residential": {
    Exterior: "Front View",
    "Exterior Front": "Front View",
    Parlor: "Living Room",
    "Parking Space": "Parking",
    Gate: "Front View",
    "Street View": "View",
    "Land View": "Front View",
    Engine: "Other",
    Dashboard: "Other",
    Tyres: "Other",
    "Boot / Trunk": "Other",
  },
  "property.shortlet": {
    Exterior: "Front View",
    "Exterior Front": "Front View",
    Parlor: "Living Room",
    "Parking Space": "Parking",
    Engine: "Other",
    Dashboard: "Other",
    Tyres: "Other",
  },
  "property.commercial": {
    Exterior: "Front View",
    "Exterior Front": "Front View",
    "Street View": "Front View",
    Gate: "Front View",
    Kitchen: "Other",
    Bedroom: "Other",
    Bathroom: "Other",
    Engine: "Other",
    Dashboard: "Other",
    Tyres: "Other",
  },
};

/**
 * Returns a label allowed by `schema`. Never returns null for non-empty input —
 * falls back to Other so photos are never lost.
 */
export function migratePhotoLabel(
  schema: PhotoSchema,
  raw: string | null | undefined
): string {
  if (!raw || !raw.trim()) {
    return schemaLabelById(schema, "other") ?? "Other";
  }

  const trimmed = raw.trim();
  if (schemaTagByLabel(schema, trimmed)) return schemaTagByLabel(schema, trimmed)!.label;

  const remapped = SCHEMA_REMAP[schema.id]?.[trimmed];
  if (remapped && schemaTagByLabel(schema, remapped)) {
    return schemaTagByLabel(schema, remapped)!.label;
  }

  const alias = LEGACY_ALIAS[trimmed.toLowerCase()];
  if (alias) {
    const viaAliasRemap = SCHEMA_REMAP[schema.id]?.[alias] ?? alias;
    if (schemaTagByLabel(schema, viaAliasRemap)) {
      return schemaTagByLabel(schema, viaAliasRemap)!.label;
    }
  }

  return schemaLabelById(schema, "other") ?? "Other";
}

export function sanitizeMediaItemLabels<T extends { room_label?: string | null }>(
  items: T[],
  schema: PhotoSchema
): T[] {
  return items.map((item) => {
    if (!item.room_label) return item;
    const next = migratePhotoLabel(schema, item.room_label);
    if (next === item.room_label) return item;
    return { ...item, room_label: next };
  });
}
