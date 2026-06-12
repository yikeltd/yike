/** Nigerian listing amenities — searchable trust signals */

export type AmenityId =
  | "prepaid_meter"
  | "borehole"
  | "generator"
  | "pop_ceiling"
  | "tiled"
  | "parking"
  | "security"
  | "gated_estate"
  | "furnished"
  | "wifi"
  | "ac"
  | "serviced"
  | "boys_quarters"
  | "water_heater"
  | "has_toilet";

export type AmenityDef = {
  id: AmenityId;
  label: string;
  shortLabel: string;
};

export const NIGERIAN_AMENITIES: AmenityDef[] = [
  { id: "prepaid_meter", label: "Prepaid meter", shortLabel: "Meter" },
  { id: "borehole", label: "Borehole water", shortLabel: "Borehole" },
  { id: "generator", label: "Generator", shortLabel: "Gen" },
  { id: "pop_ceiling", label: "POP ceiling", shortLabel: "POP" },
  { id: "tiled", label: "Tiled floors", shortLabel: "Tiled" },
  { id: "parking", label: "Parking", shortLabel: "Parking" },
  { id: "security", label: "24hr security", shortLabel: "Security" },
  { id: "gated_estate", label: "Gated estate", shortLabel: "Gated" },
  { id: "furnished", label: "Furnished", shortLabel: "Furnished" },
  { id: "wifi", label: "WiFi", shortLabel: "WiFi" },
  { id: "ac", label: "Air conditioning", shortLabel: "AC" },
  { id: "serviced", label: "Serviced", shortLabel: "Serviced" },
  { id: "boys_quarters", label: "Boys quarters", shortLabel: "BQ" },
  { id: "water_heater", label: "Water heater", shortLabel: "Heater" },
  { id: "has_toilet", label: "Has toilet", shortLabel: "Toilet" },
];

const amenityMap = new Map(NIGERIAN_AMENITIES.map((a) => [a.id, a]));

export function getAmenityLabel(id: string): string {
  return amenityMap.get(id as AmenityId)?.label ?? id.replace(/_/g, " ");
}

export function getAmenityShortLabel(id: string): string {
  return amenityMap.get(id as AmenityId)?.shortLabel ?? getAmenityLabel(id);
}

/** Top amenities to show as quick filters */
export const FILTER_AMENITIES: AmenityId[] = [
  "prepaid_meter",
  "borehole",
  "generator",
  "gated_estate",
  "furnished",
  "parking",
];
