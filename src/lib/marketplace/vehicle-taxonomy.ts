/**
 * Vehicles vertical taxonomy — road, heavy, agricultural & industrial equipment
 * under asset_type VEHICLE (no separate machinery vertical).
 */

export type VehicleCategoryGroupId =
  | "road"
  | "heavy"
  | "agricultural"
  | "industrial"
  | "marine"
  | "other";

export type VehicleCategoryId =
  | "car"
  | "suv"
  | "pickup_van"
  | "commercial_truck"
  | "bus_minibus"
  | "motorcycle_tricycle"
  | "taxi_ride_hail"
  | "emergency_special"
  | "excavator"
  | "bulldozer"
  | "wheel_loader"
  | "backhoe_loader"
  | "grader"
  | "roller_compactor"
  | "crane_lift"
  | "forklift_telehandler"
  | "dump_hauler"
  | "concrete_mixer_pump"
  | "asphalt_road_machinery"
  | "drilling_earthmoving"
  | "tractor"
  | "combine_harvester"
  | "planter_seeder"
  | "sprayer_ag"
  | "baler"
  | "ag_trailer"
  | "farm_machinery_other"
  | "industrial_generator"
  | "compressor_pump"
  | "warehouse_material_handling"
  | "industrial_machinery"
  | "commercial_equipment_other"
  | "other_vehicle_equipment"
  | "boat"
  /** @deprecated legacy ids — still queryable */
  | "truck"
  | "van"
  | "motorcycle"
  | "commercial"
  | "heavy_equipment";

export type VehicleCategoryDef = {
  id: VehicleCategoryId;
  label: string;
  plural: string;
  group: VehicleCategoryGroupId;
};

export const VEHICLE_CATEGORY_GROUPS: {
  id: VehicleCategoryGroupId;
  label: string;
}[] = [
  { id: "road", label: "Road vehicles" },
  { id: "heavy", label: "Heavy machinery & construction" },
  { id: "agricultural", label: "Agricultural machinery" },
  { id: "industrial", label: "Industrial & material handling" },
  { id: "marine", label: "Marine" },
  { id: "other", label: "Other" },
];

export const VEHICLE_TAXONOMY: VehicleCategoryDef[] = [
  { id: "car", label: "Car", plural: "Cars", group: "road" },
  { id: "suv", label: "SUV", plural: "SUVs", group: "road" },
  {
    id: "pickup_van",
    label: "Pickup, truck & van",
    plural: "Pickups & vans",
    group: "road",
  },
  {
    id: "commercial_truck",
    label: "Commercial truck & trailer",
    plural: "Commercial trucks",
    group: "road",
  },
  {
    id: "bus_minibus",
    label: "Bus & minibus",
    plural: "Buses",
    group: "road",
  },
  {
    id: "motorcycle_tricycle",
    label: "Motorcycle, scooter & tricycle",
    plural: "Motorcycles & tricycles",
    group: "road",
  },
  {
    id: "taxi_ride_hail",
    label: "Taxi & ride-hailing",
    plural: "Taxis",
    group: "road",
  },
  {
    id: "emergency_special",
    label: "Emergency & special-purpose",
    plural: "Special vehicles",
    group: "road",
  },
  { id: "excavator", label: "Excavator", plural: "Excavators", group: "heavy" },
  { id: "bulldozer", label: "Bulldozer", plural: "Bulldozers", group: "heavy" },
  {
    id: "wheel_loader",
    label: "Wheel loader",
    plural: "Wheel loaders",
    group: "heavy",
  },
  {
    id: "backhoe_loader",
    label: "Backhoe loader",
    plural: "Backhoe loaders",
    group: "heavy",
  },
  { id: "grader", label: "Grader", plural: "Graders", group: "heavy" },
  {
    id: "roller_compactor",
    label: "Road roller & compactor",
    plural: "Rollers & compactors",
    group: "heavy",
  },
  {
    id: "crane_lift",
    label: "Crane & lifting equipment",
    plural: "Cranes",
    group: "heavy",
  },
  {
    id: "forklift_telehandler",
    label: "Forklift & telehandler",
    plural: "Forklifts",
    group: "heavy",
  },
  {
    id: "dump_hauler",
    label: "Dump truck & articulated hauler",
    plural: "Dump & haul trucks",
    group: "heavy",
  },
  {
    id: "concrete_mixer_pump",
    label: "Concrete mixer & pump",
    plural: "Concrete equipment",
    group: "heavy",
  },
  {
    id: "asphalt_road_machinery",
    label: "Asphalt & road construction",
    plural: "Asphalt machinery",
    group: "heavy",
  },
  {
    id: "drilling_earthmoving",
    label: "Drilling & earthmoving",
    plural: "Drilling equipment",
    group: "heavy",
  },
  { id: "tractor", label: "Tractor", plural: "Tractors", group: "agricultural" },
  {
    id: "combine_harvester",
    label: "Combine harvester",
    plural: "Combine harvesters",
    group: "agricultural",
  },
  {
    id: "planter_seeder",
    label: "Planter & seeder",
    plural: "Planters & seeders",
    group: "agricultural",
  },
  { id: "sprayer_ag", label: "Sprayer", plural: "Sprayers", group: "agricultural" },
  { id: "baler", label: "Baler", plural: "Balers", group: "agricultural" },
  {
    id: "ag_trailer",
    label: "Agricultural trailer",
    plural: "Ag trailers",
    group: "agricultural",
  },
  {
    id: "farm_machinery_other",
    label: "Other farm machinery",
    plural: "Farm machinery",
    group: "agricultural",
  },
  {
    id: "industrial_generator",
    label: "Industrial generator & power",
    plural: "Industrial generators",
    group: "industrial",
  },
  {
    id: "compressor_pump",
    label: "Compressor & pump",
    plural: "Compressors & pumps",
    group: "industrial",
  },
  {
    id: "warehouse_material_handling",
    label: "Warehouse & material handling",
    plural: "Material handling",
    group: "industrial",
  },
  {
    id: "industrial_machinery",
    label: "Industrial production machinery",
    plural: "Industrial machinery",
    group: "industrial",
  },
  {
    id: "commercial_equipment_other",
    label: "Other commercial equipment",
    plural: "Commercial equipment",
    group: "industrial",
  },
  {
    id: "other_vehicle_equipment",
    label: "Other vehicle / equipment",
    plural: "Other equipment",
    group: "other",
  },
  { id: "boat", label: "Boat", plural: "Boats", group: "marine" },
  { id: "truck", label: "Truck (legacy)", plural: "Trucks", group: "road" },
  { id: "van", label: "Van (legacy)", plural: "Vans", group: "road" },
  {
    id: "motorcycle",
    label: "Motorcycle (legacy)",
    plural: "Motorcycles",
    group: "road",
  },
  {
    id: "commercial",
    label: "Commercial (legacy)",
    plural: "Commercial",
    group: "road",
  },
  {
    id: "heavy_equipment",
    label: "Heavy equipment (legacy)",
    plural: "Heavy equipment",
    group: "heavy",
  },
];

/** Primary browse list — hides legacy duplicates where a modern id exists. */
export const VEHICLE_CATEGORIES_BROWSE = VEHICLE_TAXONOMY.filter(
  (c) =>
    !["truck", "van", "motorcycle", "commercial", "heavy_equipment"].includes(c.id),
);

/** Consumer marketplace — five road categories (canonical persisted ids). */
export const VEHICLE_PRIMARY_MARKETPLACE_CATEGORIES: {
  id: VehicleCategoryId;
  label: string;
}[] = [
  { id: "car", label: "Cars" },
  { id: "suv", label: "SUVs" },
  { id: "pickup_van", label: "Pickups" },
  { id: "bus_minibus", label: "Buses" },
  { id: "motorcycle_tricycle", label: "Motorcycles" },
];

/** @deprecated use VEHICLE_PRIMARY_MARKETPLACE_CATEGORIES */
export const VEHICLE_HOME_SEARCH_CATEGORIES = VEHICLE_PRIMARY_MARKETPLACE_CATEGORIES;

export function vehiclePrimaryCategorySelectOptions(): {
  value: VehicleCategoryId;
  label: string;
}[] {
  return VEHICLE_PRIMARY_MARKETPLACE_CATEGORIES.map((c) => ({
    value: c.id,
    label: c.label,
  }));
}

export function isPersistedVehicleCategory(id: string): id is VehicleCategoryId {
  return VEHICLE_TAXONOMY.some((c) => c.id === id);
}

export const LEGACY_VEHICLE_CATEGORY_ALIASES: Partial<
  Record<VehicleCategoryId, VehicleCategoryId>
> = {
  truck: "pickup_van",
  van: "pickup_van",
  motorcycle: "motorcycle_tricycle",
  commercial: "commercial_truck",
  heavy_equipment: "other_vehicle_equipment",
};

export const ROAD_VEHICLE_CATEGORIES: VehicleCategoryId[] = VEHICLE_TAXONOMY.filter(
  (c) => c.group === "road",
).map((c) => c.id);

export const HEAVY_MACHINERY_CATEGORIES: VehicleCategoryId[] = VEHICLE_TAXONOMY.filter(
  (c) => c.group === "heavy",
).map((c) => c.id);

export const AGRICULTURAL_CATEGORIES: VehicleCategoryId[] = VEHICLE_TAXONOMY.filter(
  (c) => c.group === "agricultural",
).map((c) => c.id);

export const INDUSTRIAL_CATEGORIES: VehicleCategoryId[] = VEHICLE_TAXONOMY.filter(
  (c) => c.group === "industrial",
).map((c) => c.id);

export const MACHINERY_CATEGORIES: VehicleCategoryId[] = [
  ...HEAVY_MACHINERY_CATEGORIES,
  ...AGRICULTURAL_CATEGORIES,
  ...INDUSTRIAL_CATEGORIES,
  "heavy_equipment",
];

export const CAR_LIKE_CATEGORIES: VehicleCategoryId[] = [
  "car",
  "suv",
  "taxi_ride_hail",
];

export const ROAD_MILEAGE_CATEGORIES: VehicleCategoryId[] = [
  ...CAR_LIKE_CATEGORIES,
  "pickup_van",
  "truck",
  "van",
  "commercial_truck",
  "commercial",
  "bus_minibus",
  "motorcycle_tricycle",
  "motorcycle",
  "emergency_special",
  "taxi_ride_hail",
];

export const VIN_ELIGIBLE_CATEGORIES: VehicleCategoryId[] = [
  "car",
  "suv",
  "pickup_van",
  "truck",
  "van",
  "commercial_truck",
  "commercial",
  "bus_minibus",
  "taxi_ride_hail",
  "emergency_special",
];

export function vehicleCategoryLabel(id: string | null | undefined): string {
  if (!id) return "Vehicle";
  const primary = VEHICLE_PRIMARY_MARKETPLACE_CATEGORIES.find((c) => c.id === id);
  if (primary) return primary.label;
  const hit = VEHICLE_TAXONOMY.find((c) => c.id === id);
  return hit?.label ?? "Vehicle";
}

export function vehicleCategoryGroup(
  id: string | null | undefined,
): VehicleCategoryGroupId | null {
  const hit = VEHICLE_TAXONOMY.find((c) => c.id === id);
  return hit?.group ?? null;
}

export function isMachineryCategory(id: string | null | undefined): boolean {
  if (!id) return false;
  return MACHINERY_CATEGORIES.includes(id as VehicleCategoryId);
}

export function isRoadMileageCategory(id: string | null | undefined): boolean {
  if (!id) return false;
  return ROAD_MILEAGE_CATEGORIES.includes(id as VehicleCategoryId);
}

export function isYearOptionalCategory(id: string | null | undefined): boolean {
  return isMachineryCategory(id) || id === "boat" || id === "other_vehicle_equipment";
}

export function categoriesForGroup(
  group: VehicleCategoryGroupId | "",
): VehicleCategoryId[] {
  if (!group) return [];
  return VEHICLE_TAXONOMY.filter((c) => c.group === group).map((c) => c.id);
}

/** Resolve browse `group` or single `category` into DB auto_category filter ids. */
export function resolveVehicleCategoryFilter(params: {
  category?: string | null;
  group?: string | null;
}): VehicleCategoryId[] | null {
  const category = params.category?.trim();
  const group = params.group?.trim() as VehicleCategoryGroupId | undefined;
  if (category) {
    const known = VEHICLE_TAXONOMY.some((c) => c.id === category);
    return known ? [category as VehicleCategoryId] : null;
  }
  if (group && categoriesForGroup(group).length > 0) {
    return categoriesForGroup(group);
  }
  return null;
}

export function vehicleGroupLabel(group: VehicleCategoryGroupId): string {
  return VEHICLE_CATEGORY_GROUPS.find((g) => g.id === group)?.label ?? group;
}
