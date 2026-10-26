/**
 * Vehicle specification schema — forms and filters render from this registry.
 */

import {
  type VehicleCategoryId,
  VEHICLE_CATEGORIES_BROWSE,
  VEHICLE_TAXONOMY,
  isRoadMileageCategory,
  vehicleCategoryLabel,
  ROAD_MILEAGE_CATEGORIES,
  MACHINERY_CATEGORIES,
  VIN_ELIGIBLE_CATEGORIES,
  CAR_LIKE_CATEGORIES,
} from "@/lib/marketplace/vehicle-taxonomy";

export type { VehicleCategoryId };
export {
  VEHICLE_TAXONOMY,
  VEHICLE_CATEGORIES_BROWSE,
  VEHICLE_HOME_SEARCH_CATEGORIES,
  vehicleCategoryLabel,
  isMachineryCategory,
  isRoadMileageCategory,
  isYearOptionalCategory,
  resolveVehicleCategoryFilter,
  categoriesForGroup,
  vehicleGroupLabel,
  VEHICLE_CATEGORY_GROUPS,
  type VehicleCategoryGroupId,
} from "@/lib/marketplace/vehicle-taxonomy";

/** Flat category list for selects (includes legacy ids for stored listings). */
export const VEHICLE_CATEGORIES = VEHICLE_TAXONOMY.map((c) => ({
  id: c.id,
  label: c.label,
  plural: c.plural,
}));

export type SpecFieldType =
  | "text"
  | "number"
  | "select"
  | "boolean"
  | "year";

export type VehicleSpecField = {
  key: string;
  label: string;
  type: SpecFieldType;
  required?: boolean;
  column?: string;
  attribute?: boolean;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  placeholder?: string;
  categories?: VehicleCategoryId[];
};

export const VEHICLE_CONDITION_OPTIONS = [
  { value: "new", label: "Brand new" },
  { value: "foreign_used", label: "Foreign used" },
  { value: "nigerian_used", label: "Nigerian used" },
  { value: "refurbished", label: "Refurbished / reconditioned" },
  { value: "used", label: "Used" },
  { value: "certified", label: "Certified pre-owned" },
] as const;

export const VEHICLE_SPEC_FIELDS: VehicleSpecField[] = [
  {
    key: "make",
    label: "Make / brand",
    type: "text",
    required: true,
    column: "make",
    placeholder: "Toyota",
  },
  {
    key: "model",
    label: "Model",
    type: "text",
    required: true,
    column: "model",
    placeholder: "Camry",
  },
  {
    key: "year",
    label: "Year of manufacture",
    type: "year",
    column: "year",
    min: 1980,
    max: new Date().getFullYear() + 1,
  },
  {
    key: "trim",
    label: "Trim",
    type: "text",
    column: "trim",
    placeholder: "XLE",
    categories: [...CAR_LIKE_CATEGORIES, "pickup_van", "truck", "van"],
  },
  {
    key: "transmission",
    label: "Transmission",
    type: "select",
    column: "transmission",
    options: [
      { value: "automatic", label: "Automatic" },
      { value: "manual", label: "Manual" },
      { value: "cvt", label: "CVT" },
      { value: "other", label: "Other" },
    ],
    categories: ROAD_MILEAGE_CATEGORIES,
  },
  {
    key: "fuel_type",
    label: "Fuel / power type",
    type: "select",
    column: "fuel_type",
    options: [
      { value: "petrol", label: "Petrol" },
      { value: "diesel", label: "Diesel" },
      { value: "hybrid", label: "Hybrid" },
      { value: "electric", label: "Electric" },
      { value: "lpg", label: "LPG" },
      { value: "other", label: "Other" },
    ],
    categories: [...ROAD_MILEAGE_CATEGORIES, ...MACHINERY_CATEGORIES],
  },
  {
    key: "mileage",
    label: "Mileage (km)",
    type: "number",
    column: "mileage",
    min: 0,
    categories: ROAD_MILEAGE_CATEGORIES,
  },
  {
    key: "condition",
    label: "Condition",
    type: "select",
    column: "vehicle_condition",
    required: true,
    options: [...VEHICLE_CONDITION_OPTIONS],
  },
  {
    key: "seller_type",
    label: "Seller type",
    type: "select",
    attribute: true,
    options: [
      { value: "owner", label: "Owner" },
      { value: "dealer", label: "Dealer" },
      { value: "equipment_supplier", label: "Equipment supplier" },
    ],
  },
  {
    key: "price_negotiable",
    label: "Price negotiable",
    type: "boolean",
    attribute: true,
  },
  {
    key: "vin",
    label: "VIN",
    type: "text",
    column: "vin",
    placeholder: "Optional",
    categories: VIN_ELIGIBLE_CATEGORIES,
  },
  {
    key: "exterior_color",
    label: "Exterior color",
    type: "text",
    column: "exterior_color",
    categories: [...CAR_LIKE_CATEGORIES, "pickup_van", "truck", "van", "bus_minibus"],
  },
  {
    key: "interior_color",
    label: "Interior color",
    type: "text",
    column: "interior_color",
    categories: [...CAR_LIKE_CATEGORIES, "pickup_van", "truck", "van"],
  },
  {
    key: "body_type",
    label: "Body style",
    type: "select",
    column: "body_type",
    options: [
      { value: "sedan", label: "Sedan" },
      { value: "hatchback", label: "Hatchback" },
      { value: "coupe", label: "Coupe" },
      { value: "wagon", label: "Wagon" },
      { value: "pickup", label: "Pickup" },
      { value: "bus", label: "Bus" },
      { value: "convertible", label: "Convertible" },
      { value: "other", label: "Other" },
    ],
    categories: [...CAR_LIKE_CATEGORIES, "pickup_van", "truck", "van"],
  },
  {
    key: "engine_capacity",
    label: "Engine capacity (cc/L)",
    type: "text",
    attribute: true,
    categories: [...CAR_LIKE_CATEGORIES, "motorcycle_tricycle", "motorcycle"],
  },
  {
    key: "drivetrain",
    label: "Drivetrain",
    type: "select",
    column: "drivetrain",
    options: [
      { value: "fwd", label: "FWD" },
      { value: "rwd", label: "RWD" },
      { value: "awd", label: "AWD" },
      { value: "4wd", label: "4WD" },
    ],
    categories: [...CAR_LIKE_CATEGORIES, "pickup_van", "truck", "van", "suv"],
  },
  {
    key: "engine",
    label: "Engine / power spec",
    type: "text",
    column: "engine",
    placeholder: "2.5L I4 or 150 kVA",
  },
  {
    key: "vehicle_class",
    label: "Vehicle class / intended use",
    type: "text",
    attribute: true,
    categories: ["commercial_truck", "commercial", "bus_minibus", "dump_hauler"],
  },
  {
    key: "payload_capacity",
    label: "Payload / GVW (tons)",
    type: "number",
    attribute: true,
    min: 0,
    categories: [
      "commercial_truck",
      "commercial",
      "bus_minibus",
      "dump_hauler",
      "pickup_van",
      "truck",
    ],
  },
  {
    key: "axle_configuration",
    label: "Axle configuration",
    type: "text",
    attribute: true,
    categories: ["commercial_truck", "commercial", "dump_hauler"],
  },
  {
    key: "trailer_compatible",
    label: "Trailer compatible",
    type: "boolean",
    attribute: true,
    categories: ["commercial_truck", "commercial", "pickup_van", "truck"],
  },
  {
    key: "operating_hours",
    label: "Operating hours",
    type: "number",
    attribute: true,
    min: 0,
    categories: MACHINERY_CATEGORIES,
  },
  {
    key: "operating_weight",
    label: "Operating weight / capacity (tons)",
    type: "number",
    attribute: true,
    min: 0,
    categories: MACHINERY_CATEGORIES,
  },
  {
    key: "horsepower",
    label: "Horsepower / rated power",
    type: "number",
    attribute: true,
    min: 0,
    categories: [...MACHINERY_CATEGORIES, "tractor", "combine_harvester"],
  },
  {
    key: "drive_type",
    label: "Drive / track type",
    type: "select",
    attribute: true,
    options: [
      { value: "wheeled", label: "Wheeled" },
      { value: "tracked", label: "Tracked" },
      { value: "4wd", label: "4WD" },
      { value: "other", label: "Other" },
    ],
    categories: MACHINERY_CATEGORIES,
  },
  {
    key: "attachments",
    label: "Attachments & accessories",
    type: "text",
    attribute: true,
    categories: MACHINERY_CATEGORIES,
  },
  {
    key: "service_history",
    label: "Service history / working condition",
    type: "text",
    attribute: true,
    categories: MACHINERY_CATEGORIES,
  },
  {
    key: "suitable_applications",
    label: "Suitable applications",
    type: "text",
    attribute: true,
    categories: MACHINERY_CATEGORIES,
  },
  {
    key: "implement_compatibility",
    label: "Implement compatibility",
    type: "text",
    attribute: true,
    categories: [
      "tractor",
      "combine_harvester",
      "planter_seeder",
      "farm_machinery_other",
    ],
  },
  {
    key: "registration_status",
    label: "Registration status",
    type: "select",
    column: "registration_status",
    options: [
      { value: "registered", label: "Registered" },
      { value: "unregistered", label: "Unregistered" },
      { value: "custom_papers", label: "Custom papers" },
      { value: "duty_paid", label: "Duty paid" },
    ],
    categories: ROAD_MILEAGE_CATEGORIES,
  },
  {
    key: "financing_available",
    label: "Financing available",
    type: "boolean",
    column: "financing_available",
  },
];

export function specsForCategory(
  category: VehicleCategoryId | null | undefined,
): VehicleSpecField[] {
  return VEHICLE_SPEC_FIELDS.filter((field) => {
    if (!field.categories || field.categories.length === 0) return true;
    if (!category) return true;
    return field.categories.includes(category);
  });
}
