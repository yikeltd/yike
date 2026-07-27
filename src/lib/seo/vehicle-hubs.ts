import { VEHICLE_MAKE_TYPES, VEHICLE_MAKES } from "@/lib/marketplace/vehicle-makes";
import { getAllSeoCitySlugs, PRIORITY_CITY_SLUGS } from "@/lib/seo/paths";
import { toSlug } from "@/lib/location-slugs";
import { resolveCitySlug } from "@/lib/location-slugs";

export function vehicleMakeSlug(make: string): string {
  return toSlug(make);
}

export function resolveVehicleMake(slug: string): string | null {
  const hit = VEHICLE_MAKES.find((m) => vehicleMakeSlug(m) === slug.toLowerCase());
  return hit ?? null;
}

export function resolveVehicleModel(make: string, modelSlug: string): string | null {
  const models = VEHICLE_MAKE_TYPES[make] ?? [];
  return models.find((m) => toSlug(m) === modelSlug.toLowerCase()) ?? null;
}

export function getVehicleMakeParams(): { make: string }[] {
  return VEHICLE_MAKES.slice(0, 48).map((make) => ({
    make: vehicleMakeSlug(make),
  }));
}

export function getVehicleMakeModelParams(): { make: string; model: string }[] {
  const out: { make: string; model: string }[] = [];
  for (const make of VEHICLE_MAKES.slice(0, 24)) {
    for (const model of (VEHICLE_MAKE_TYPES[make] ?? []).slice(0, 8)) {
      out.push({ make: vehicleMakeSlug(make), model: toSlug(model) });
    }
  }
  return out;
}

export function getVehicleCityParams(): { city: string }[] {
  return PRIORITY_CITY_SLUGS.slice(0, 24).map((city) => ({ city }));
}

export function getCarsSitemapPaths(): string[] {
  const paths = ["/cars"];
  for (const { make } of getVehicleMakeParams()) {
    paths.push(`/cars/${make}`);
  }
  for (const { make, model } of getVehicleMakeModelParams().slice(0, 120)) {
    paths.push(`/cars/${make}/${model}`);
  }
  for (const city of getAllSeoCitySlugs().slice(0, 24)) {
    if (!resolveVehicleMake(city)) paths.push(`/cars/${city}`);
  }
  return paths;
}

export function resolveCarsSegment(segment: string): {
  kind: "make" | "city";
  make?: string;
  city?: string;
  state?: string;
} | null {
  const make = resolveVehicleMake(segment);
  if (make) return { kind: "make", make };
  const city = resolveCitySlug(segment);
  if (city) return { kind: "city", city: city.city, state: city.state };
  return null;
}
