/**
 * Vehicle submission adapter — maps engine values to the exact payload shape
 * `VehicleListingForm` posts to `/api/agent/vehicles/create` (see
 * src/components/marketplace/vehicle-listing-form.tsx `onSubmit`). Reuses
 * the existing create API — no parallel listing endpoint.
 */
import type { ListingValues } from "../types";

export type VehiclePayload = Record<string, unknown>;

function numberOrUndefined(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function boolFromFormValue(value: unknown): boolean {
  return value === true || value === "on" || value === "true";
}

export function valuesToVehiclePayload(
  values: ListingValues,
  opts: { listingId?: string; mediaUrls?: string[] } = {}
): VehiclePayload {
  const mediaUrls =
    opts.mediaUrls ?? (Array.isArray(values.media_urls) ? (values.media_urls as string[]) : []);

  return {
    id: opts.listingId,
    auto_category: values.auto_category,
    title: values.title,
    description: values.description,
    price: numberOrUndefined(values.price),
    state: values.state,
    city: values.city,
    area: values.area || values.city,
    media_urls: mediaUrls,
    make: values.make,
    model: values.model,
    year: numberOrUndefined(values.year),
    trim: values.trim || undefined,
    transmission: values.transmission || undefined,
    fuel_type: values.fuel_type || undefined,
    mileage: numberOrUndefined(values.mileage),
    vehicle_condition: values.vehicle_condition,
    vin: values.vin || undefined,
    exterior_color: values.exterior_color || undefined,
    interior_color: values.interior_color || undefined,
    body_type: values.body_type || undefined,
    drivetrain: values.drivetrain || undefined,
    engine: values.engine || undefined,
    registration_status: values.registration_status || undefined,
    financing_available: boolFromFormValue(values.financing_available),
  };
}
