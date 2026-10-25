import type { VehicleListingInput } from "@/lib/marketplace/listings";
import type { VehicleCategoryId } from "@/lib/marketplace/vehicle-specs";
import {
  VEHICLE_CATEGORIES,
  VEHICLE_CONDITION_OPTIONS,
} from "@/lib/marketplace/vehicle-specs";
import { isYearOptionalCategory } from "@/lib/marketplace/vehicle-taxonomy";
import {
  LISTING_CREATE_MAX_PHOTOS,
  LISTING_CREATE_MIN_PHOTOS,
} from "@/lib/listing-create/constants";
import { isSafeListingMediaUrl } from "@/lib/listing-create/media-url";

export const VEHICLE_CREATE_MIN_PHOTOS = LISTING_CREATE_MIN_PHOTOS;
export const VEHICLE_CREATE_MAX_PHOTOS = LISTING_CREATE_MAX_PHOTOS;

export { isSafeListingMediaUrl } from "@/lib/listing-create/media-url";

const VALID_VEHICLE_CONDITIONS = new Set(
  VEHICLE_CONDITION_OPTIONS.map((o) => o.value),
);

export function parseVehicleBody(
  body: Record<string, unknown>,
): VehicleListingInput | null {
  const auto_category = String(body.auto_category ?? "").trim() as VehicleCategoryId;
  if (!VEHICLE_CATEGORIES.some((c) => c.id === auto_category)) return null;

  const title = String(body.title ?? "").trim();
  const make = String(body.make ?? "").trim();
  const model = String(body.model ?? "").trim();
  const yearRaw = body.year;
  const year =
    yearRaw != null && yearRaw !== "" ? Number(yearRaw) : null;
  const price = Number(body.price);
  const state = String(body.state ?? "").trim();
  const city = String(body.city ?? "").trim();
  const vehicle_condition = String(
    body.vehicle_condition ?? body.condition ?? "",
  ).trim();

  if (!title || !make || !model || !state || !city || !vehicle_condition) return null;
  if (!VALID_VEHICLE_CONDITIONS.has(vehicle_condition as (typeof VEHICLE_CONDITION_OPTIONS)[number]["value"])) {
    return null;
  }
  if (isYearOptionalCategory(auto_category)) {
    if (year != null && (!Number.isFinite(year) || year < 1980)) return null;
  } else if (!Number.isFinite(year) || year! < 1980) {
    return null;
  }
  if (!Number.isFinite(price) || price <= 0) return null;

  const media = Array.isArray(body.media_urls)
    ? body.media_urls.map(String).filter(Boolean)
    : [];

  if (
    media.length < VEHICLE_CREATE_MIN_PHOTOS ||
    media.length > VEHICLE_CREATE_MAX_PHOTOS ||
    media.some((url) => !isSafeListingMediaUrl(url))
  ) {
    return null;
  }

  return {
    title,
    description: body.description != null ? String(body.description) : undefined,
    price,
    state,
    city,
    area: body.area != null ? String(body.area) : city,
    auto_category,
    media_urls: media,
    video_url: body.video_url != null ? String(body.video_url) : null,
    make,
    model,
    year,
    trim: body.trim != null ? String(body.trim) : null,
    transmission: body.transmission != null ? String(body.transmission) : null,
    fuel_type: body.fuel_type != null ? String(body.fuel_type) : null,
    mileage:
      body.mileage != null && body.mileage !== "" ? Number(body.mileage) : null,
    vehicle_condition,
    vin: body.vin != null ? String(body.vin) : null,
    exterior_color:
      body.exterior_color != null ? String(body.exterior_color) : null,
    interior_color:
      body.interior_color != null ? String(body.interior_color) : null,
    body_type: body.body_type != null ? String(body.body_type) : null,
    drivetrain: body.drivetrain != null ? String(body.drivetrain) : null,
    engine: body.engine != null ? String(body.engine) : null,
    registration_status:
      body.registration_status != null
        ? String(body.registration_status)
        : null,
    financing_available: Boolean(body.financing_available),
    attributes:
      body.attributes && typeof body.attributes === "object"
        ? (body.attributes as Record<string, unknown>)
        : {},
  };
}
