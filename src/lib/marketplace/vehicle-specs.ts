/**
 * Reusable vehicle specification schema — forms render from this registry.
 */

export type VehicleCategoryId =
  | "car"
  | "suv"
  | "truck"
  | "van"
  | "motorcycle"
  | "commercial"
  | "heavy_equipment"
  | "boat";

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
  /** Column on properties when promoted for indexing */
  column?: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  placeholder?: string;
  /** Categories that show this field; omit = all */
  categories?: VehicleCategoryId[];
};

export const VEHICLE_CATEGORIES: {
  id: VehicleCategoryId;
  label: string;
  plural: string;
}[] = [
  { id: "car", label: "Car", plural: "Cars" },
  { id: "suv", label: "SUV", plural: "SUVs" },
  { id: "truck", label: "Truck", plural: "Trucks" },
  { id: "van", label: "Van", plural: "Vans" },
  { id: "motorcycle", label: "Motorcycle", plural: "Motorcycles" },
  { id: "commercial", label: "Commercial Vehicle", plural: "Commercial Vehicles" },
  { id: "heavy_equipment", label: "Heavy Equipment", plural: "Heavy Equipment" },
  { id: "boat", label: "Boat", plural: "Boats" },
];

export const VEHICLE_SPEC_FIELDS: VehicleSpecField[] = [
  {
    key: "make",
    label: "Make",
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
    label: "Year",
    type: "year",
    required: true,
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
  },
  {
    key: "fuel_type",
    label: "Fuel Type",
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
  },
  {
    key: "mileage",
    label: "Mileage (km)",
    type: "number",
    column: "mileage",
    min: 0,
  },
  {
    key: "condition",
    label: "Condition",
    type: "select",
    column: "vehicle_condition",
    required: true,
    options: [
      { value: "new", label: "New" },
      { value: "foreign_used", label: "Foreign used" },
      { value: "nigerian_used", label: "Nigerian used" },
      { value: "certified", label: "Certified pre-owned" },
    ],
  },
  {
    key: "vin",
    label: "VIN",
    type: "text",
    column: "vin",
    placeholder: "Optional",
    categories: ["car", "suv", "truck", "van", "commercial"],
  },
  {
    key: "exterior_color",
    label: "Exterior Color",
    type: "text",
    column: "exterior_color",
  },
  {
    key: "interior_color",
    label: "Interior Color",
    type: "text",
    column: "interior_color",
    categories: ["car", "suv", "truck", "van", "commercial"],
  },
  {
    key: "body_type",
    label: "Body Type",
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
    categories: ["car", "suv", "truck", "van", "commercial"],
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
    categories: ["car", "suv", "truck", "van", "commercial"],
  },
  {
    key: "engine",
    label: "Engine",
    type: "text",
    column: "engine",
    placeholder: "2.5L I4",
  },
  {
    key: "registration_status",
    label: "Registration Status",
    type: "select",
    column: "registration_status",
    options: [
      { value: "registered", label: "Registered" },
      { value: "unregistered", label: "Unregistered" },
      { value: "custom_papers", label: "Custom papers" },
      { value: "duty_paid", label: "Duty paid" },
    ],
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

export function vehicleCategoryLabel(id: string | null | undefined): string {
  return VEHICLE_CATEGORIES.find((c) => c.id === id)?.label ?? "Vehicle";
}
