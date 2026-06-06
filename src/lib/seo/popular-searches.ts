import { toSlug } from "@/lib/location-slugs";

/** Local long-tail links — unique per page, not thin duplicates. */
export function popularLocalSearches(
  city: string,
  citySlug: string,
  neighborhood?: string,
  neighborhoodSlug?: string
): { label: string; href: string }[] {
  const base = neighborhood
    ? `/houses/${citySlug}/${neighborhoodSlug ?? toSlug(neighborhood)}`
    : `/houses/${citySlug}`;

  const areaLabel = neighborhood ?? city;
  const qs = (params: Record<string, string>) => {
    const p = new URLSearchParams({ city, ...params });
    if (neighborhood) p.set("area", neighborhood);
    return `/search?${p.toString()}`;
  };

  return [
    { label: `2 bedroom in ${areaLabel}`, href: qs({ beds: "2", type: "rent" }) },
    { label: `Self contain ${areaLabel}`, href: qs({ property_type: "self_contain", type: "rent" }) },
    { label: `Mini flat ${areaLabel}`, href: qs({ property_type: "mini_flat", type: "rent" }) },
    { label: `Shops in ${areaLabel}`, href: qs({ property_type: "shop" }) },
    { label: `Land in ${city}`, href: `/land?city=${encodeURIComponent(city)}` },
    { label: `All homes in ${areaLabel}`, href: `${base}` },
  ];
}
