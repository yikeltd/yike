export type ValueDriverCategory =
  | "location"
  | "condition"
  | "commercial"
  | "land_documents"
  | "lifestyle";

export type ValueDriverStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "requires_evidence";

export type ValueDriverDefinition = {
  key: string;
  label: string;
  category: ValueDriverCategory;
  highRisk?: boolean;
};

export const VALUE_DRIVER_CATEGORIES: {
  id: ValueDriverCategory;
  title: string;
}[] = [
  { id: "location", title: "Location Advantage" },
  { id: "condition", title: "Property Condition" },
  { id: "commercial", title: "Commercial Advantage" },
  { id: "land_documents", title: "Land & Document Signals" },
  { id: "lifestyle", title: "Lifestyle & Convenience" },
];

export const VALUE_DRIVERS: ValueDriverDefinition[] = [
  { key: "premium_road", label: "Premium road access", category: "location" },
  { key: "tarred_road", label: "Tarred road", category: "location" },
  { key: "close_to_main_road", label: "Close to main road", category: "location" },
  { key: "waterfront", label: "Waterfront location", category: "location", highRisk: true },
  { key: "gated_estate", label: "Gated estate", category: "location" },
  { key: "corner_piece", label: "Corner piece", category: "location" },
  { key: "new_construction", label: "New construction", category: "condition" },
  { key: "newly_renovated", label: "Newly renovated", category: "condition" },
  { key: "luxury_finish", label: "Luxury finish", category: "condition" },
  { key: "furnished", label: "Fully furnished", category: "condition" },
  { key: "shortlet_ready", label: "Shortlet ready", category: "condition" },
  { key: "commercial_zone", label: "Commercial zone", category: "commercial", highRisk: true },
  { key: "high_foot_traffic", label: "High foot traffic", category: "commercial" },
  { key: "shop_frontage", label: "Shop frontage", category: "commercial" },
  { key: "office_ready", label: "Office ready", category: "commercial" },
  { key: "warehouse_access", label: "Warehouse access", category: "commercial" },
  { key: "parking_available", label: "Parking available", category: "commercial" },
  { key: "dry_land", label: "Dry land", category: "land_documents" },
  { key: "serviced_plot", label: "Serviced plot", category: "land_documents", highRisk: true },
  { key: "titled_land", label: "Titled land", category: "land_documents", highRisk: true },
  { key: "c_of_o", label: "C of O available", category: "land_documents", highRisk: true },
  { key: "governor_consent", label: "Governor's consent", category: "land_documents", highRisk: true },
  { key: "survey_available", label: "Survey available", category: "land_documents", highRisk: true },
  { key: "deed_available", label: "Deed available", category: "land_documents", highRisk: true },
  { key: "close_to_market", label: "Close to market", category: "lifestyle" },
  { key: "close_to_school", label: "Close to school", category: "lifestyle" },
  { key: "close_to_hospital", label: "Close to hospital", category: "lifestyle" },
  { key: "steady_power_area", label: "Steady power area", category: "lifestyle" },
  { key: "security_presence", label: "Security presence", category: "lifestyle" },
];

export const MAX_VALUE_DRIVER_SELECTIONS = 8;

export const HIGH_RISK_VALUE_DRIVER_KEYS = new Set(
  VALUE_DRIVERS.filter((d) => d.highRisk).map((d) => d.key)
);

const DRIVER_MAP = new Map(VALUE_DRIVERS.map((d) => [d.key, d]));

export function getValueDriverDefinition(key: string): ValueDriverDefinition | undefined {
  return DRIVER_MAP.get(key);
}

export function isHighRiskValueDriver(key: string): boolean {
  return HIGH_RISK_VALUE_DRIVER_KEYS.has(key);
}

export function valueDriversByCategory(): Map<ValueDriverCategory, ValueDriverDefinition[]> {
  const map = new Map<ValueDriverCategory, ValueDriverDefinition[]>();
  for (const cat of VALUE_DRIVER_CATEGORIES) {
    map.set(
      cat.id,
      VALUE_DRIVERS.filter((d) => d.category === cat.id)
    );
  }
  return map;
}

/** Careful public price explanation — never a guarantee. */
export function buildPriceExplanation(labels: string[]): string | null {
  if (labels.length === 0) return null;
  const unique = [...new Set(labels.map((l) => l.toLowerCase()))];
  if (unique.length === 1) {
    return `This listing includes ${unique[0]}, which can influence pricing in this area.`;
  }
  if (unique.length === 2) {
    return `This listing includes ${unique[0]} and ${unique[1]}, which may help explain the price in this area.`;
  }
  const head = unique.slice(0, -1).join(", ");
  const tail = unique[unique.length - 1];
  return `This listing includes ${head}, and ${tail}, which may help explain pricing in this area.`;
}
