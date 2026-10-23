/**
 * Vehicle catalog providers — wire existing vehicle catalogs into the
 * category-agnostic engine. No business logic lives here, only lookups.
 */
import {
  VEHICLE_CATEGORIES_BROWSE,
  VEHICLE_SPEC_FIELDS,
  VEHICLE_CONDITION_OPTIONS,
} from "@/lib/marketplace/vehicle-specs";
import { VEHICLE_MAKES, typesForMake } from "@/lib/marketplace/vehicle-makes";
import type { FieldOption } from "../types";
import type { CatalogMap } from "./types";

function specOptions(key: string): FieldOption[] {
  const field = VEHICLE_SPEC_FIELDS.find((f) => f.key === key);
  return field?.options ?? [];
}

export const VEHICLE_CATALOGS: CatalogMap = {
  "vehicle.types": () =>
    VEHICLE_CATEGORIES_BROWSE.map((c) => ({ value: c.id, label: c.label })),
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
};
