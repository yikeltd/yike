import { toSlug } from "@/lib/location-slugs";

export type PopularArea = {
  label: string;
  city: string;
  area: string;
  state: string;
  href: string;
  seoPath: string;
};

function areaLink(city: string, area: string, state: string): PopularArea {
  const citySlug = toSlug(city === "Abuja" ? "abuja" : city);
  const areaSlug = toSlug(area);
  return {
    label: `${city} · ${area}`,
    city,
    area,
    state,
    href: `/search?city=${encodeURIComponent(city)}&area=${encodeURIComponent(area)}`,
    seoPath: `/houses/${citySlug}/${areaSlug}`,
  };
}

/** High-intent neighborhoods for chips, SEO, and suggestions */
export const POPULAR_AREAS: PopularArea[] = [
  areaLink("Lagos", "Lekki", "Lagos"),
  areaLink("Lagos", "Yaba", "Lagos"),
  areaLink("Abuja", "Gwarinpa", "FCT"),
  areaLink("Abuja", "Wuse 2", "FCT"),
  areaLink("Port Harcourt", "GRA", "Rivers"),
  areaLink("Lagos", "Chevron", "Lagos"),
  areaLink("Enugu", "New Haven", "Enugu"),
  areaLink("Ibadan", "Bodija", "Oyo"),
  areaLink("Aba", "Ogbor Hill", "Abia"),
  areaLink("Aba", "Ariaria", "Abia"),
  areaLink("Owerri", "Ikenegbu", "Imo"),
  areaLink("Uyo", "Ewet Housing", "Akwa Ibom"),
  areaLink("Benin City", "Ugbowo", "Edo"),
  areaLink("Calabar", "Marian", "Cross River"),
  areaLink("Asaba", "Core Area", "Delta"),
  areaLink("Kano", "Nassarawa", "Kano"),
  areaLink("Kaduna", "Barnawa", "Kaduna"),
];

export const TRENDING_SEARCH_LINKS = POPULAR_AREAS.map((a) => ({
  label: a.label,
  href: a.href,
}));
