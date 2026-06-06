import { toSlug } from "@/lib/location-slugs";

const IMG = (id: string) =>
  `https://images.unsplash.com/${id}?w=600&q=75&auto=format&fit=crop`;

export type TrendingCity = {
  name: string;
  slug: string;
  state: string;
  searchCity: string;
  image: string;
  tagline: string;
  href: string;
  seoPath: string;
};

export const TRENDING_CITIES: TrendingCity[] = [
  {
    name: "Lagos",
    slug: "lagos",
    state: "Lagos",
    searchCity: "Lagos",
    image: IMG("photo-1600585154340-be6161a56a0c"),
    tagline: "Rentals, shortlets & sales",
    href: "/search?city=Lagos",
    seoPath: "/houses/lagos",
  },
  {
    name: "Abuja",
    slug: "abuja",
    state: "FCT",
    searchCity: "Abuja",
    image: IMG("photo-1600607687939-ce8a6c25118c"),
    tagline: "Homes in the capital",
    href: "/search?city=Abuja",
    seoPath: "/houses/abuja",
  },
  {
    name: "Port Harcourt",
    slug: "port-harcourt",
    state: "Rivers",
    searchCity: "Port Harcourt",
    image: IMG("photo-1600566753190-17f0baa5a365"),
    tagline: "GRA, Woji & more",
    href: "/search?city=Port%20Harcourt",
    seoPath: "/houses/port-harcourt",
  },
  {
    name: "Enugu",
    slug: "enugu",
    state: "Enugu",
    searchCity: "Enugu",
    image: IMG("photo-1600596542815-ffad4c1539a9"),
    tagline: "Coal City homes",
    href: "/search?city=Enugu",
    seoPath: "/houses/enugu",
  },
  {
    name: "Aba",
    slug: "aba",
    state: "Abia",
    searchCity: "Aba",
    image: IMG("photo-1560448204-e02f11c3d0e2"),
    tagline: "Affordable verified rentals",
    href: "/search?city=Aba",
    seoPath: "/houses/aba",
  },
  {
    name: "Owerri",
    slug: "owerri",
    state: "Imo",
    searchCity: "Owerri",
    image: IMG("photo-1502672260266-1c1ef2d93688"),
    tagline: "Shortlets & family homes",
    href: "/search?city=Owerri",
    seoPath: "/houses/owerri",
  },
  {
    name: "Uyo",
    slug: "uyo",
    state: "Akwa Ibom",
    searchCity: "Uyo",
    image: IMG("photo-1600047509807-ba8f8d28b018"),
    tagline: "Ewet Housing & beyond",
    href: "/search?city=Uyo",
    seoPath: "/houses/uyo",
  },
  {
    name: "Benin City",
    slug: "benin-city",
    state: "Edo",
    searchCity: "Benin City",
    image: IMG("photo-1600210492486-724fe9c0fb0f"),
    tagline: "Student & family areas",
    href: "/search?city=Benin%20City",
    seoPath: "/houses/benin-city",
  },
  {
    name: "Ibadan",
    slug: "ibadan",
    state: "Oyo",
    searchCity: "Ibadan",
    image: IMG("photo-1600585154526-990dced4db0d"),
    tagline: "Bodija, UI & Akobo",
    href: "/search?city=Ibadan",
    seoPath: "/houses/ibadan",
  },
  {
    name: "Asaba",
    slug: "asaba",
    state: "Delta",
    searchCity: "Asaba",
    image: IMG("photo-1493809842364-78817add7ffb"),
    tagline: "Delta State capital",
    href: "/search?city=Asaba",
    seoPath: "/houses/asaba",
  },
];

export function getTrendingCityBySlug(slug: string): TrendingCity | undefined {
  return TRENDING_CITIES.find((c) => c.slug === slug);
}

export function getAllCitySlugs(): string[] {
  return TRENDING_CITIES.map((c) => c.slug);
}
