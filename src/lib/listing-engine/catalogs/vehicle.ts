/**
 * Vehicle catalog providers — wire existing vehicle catalogs into the
 * category-agnostic engine. No business logic lives here, only lookups.
 */
import {
  VEHICLE_SPEC_FIELDS,
  VEHICLE_CONDITION_OPTIONS,
} from "@/lib/marketplace/vehicle-specs";
import { vehicleHomeSearchCategorySelectOptions } from "@/lib/marketplace/vehicle-taxonomy";
import { VEHICLE_MAKES, typesForMake } from "@/lib/marketplace/vehicle-makes";
import type { FieldOption } from "../types";
import type { CatalogMap } from "./types";
import { vehicleYearOptions } from "../catalogues/spec-presets";

const MILEAGE_BUCKETS: FieldOption[] = [
  { value: "10000", label: "Under 25,000 km" },
  { value: "40000", label: "25,000 – 50,000 km" },
  { value: "75000", label: "50,000 – 100,000 km" },
  { value: "125000", label: "100,000 – 150,000 km" },
  { value: "175000", label: "150,000 – 200,000 km" },
  { value: "250000", label: "200,000+ km" },
];

function specOptions(key: string): FieldOption[] {
  const field = VEHICLE_SPEC_FIELDS.find((f) => f.key === key);
  return field?.options ?? [];
}

export const VEHICLE_CATALOGS: CatalogMap = {
  "vehicle.types": () =>
    vehicleHomeSearchCategorySelectOptions().flatMap((o) =>
      "value" in o ? [{ value: o.value, label: o.label }] : [],
    ),
  "vehicle.makes": () => VEHICLE_MAKES.map((m) => ({ value: m, label: m })),
  "vehicle.models_for_make": (values) => {
    const make = String(values.make ?? "");
    return typesForMake(make).map((m) => ({ value: m, label: m }));
  },
  "vehicle.transmission": () => specOptions("transmission"),
  "vehicle.fuel_type": () => specOptions("fuel_type"),
  "vehicle.condition": () =>
    VEHICLE_CONDITION_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
  "vehicle.seller_type": () => specOptions("seller_type"),
  "vehicle.drive_type": () => specOptions("drive_type"),
  "vehicle.body_type": () => specOptions("body_type"),
  "vehicle.drivetrain": () => specOptions("drivetrain"),
  "vehicle.registration_status": () => specOptions("registration_status"),
  "vehicle.years": () => vehicleYearOptions(1980),
  "vehicle.mileage_presets": () => MILEAGE_BUCKETS,
};
