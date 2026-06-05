/** Programmatic SEO property types — slug, label, and listing filters */

export type SeoPropertyType = {
  slug: string;
  label: string;
  pluralLabel: string;
  dbValue?: string;
  bedrooms?: number;
  listingType?: "rent" | "sale" | "shortlet" | "lease";
  group: "residential" | "commercial" | "land" | "shortlet" | "student";
};

export const SEO_PROPERTY_TYPES: SeoPropertyType[] = [
  { slug: "self-contain", label: "Self Contain", pluralLabel: "Self Contains", dbValue: "self_contain", group: "residential" },
  { slug: "room-and-parlour", label: "Room and Parlour", pluralLabel: "Room and Parlour", dbValue: "room", group: "residential" },
  { slug: "mini-flat", label: "Mini Flat", pluralLabel: "Mini Flats", dbValue: "mini_flat", group: "residential" },
  { slug: "1-bedroom-flat", label: "1 Bedroom Flat", pluralLabel: "1 Bedroom Flats", dbValue: "flat", bedrooms: 1, group: "residential" },
  { slug: "2-bedroom-flat", label: "2 Bedroom Flat", pluralLabel: "2 Bedroom Flats", dbValue: "flat", bedrooms: 2, group: "residential" },
  { slug: "3-bedroom-flat", label: "3 Bedroom Flat", pluralLabel: "3 Bedroom Flats", dbValue: "flat", bedrooms: 3, group: "residential" },
  { slug: "duplex", label: "Duplex", pluralLabel: "Duplexes", dbValue: "duplex", group: "residential" },
  { slug: "bungalow", label: "Bungalow", pluralLabel: "Bungalows", dbValue: "bungalow", group: "residential" },
  { slug: "student-lodge", label: "Student Lodge", pluralLabel: "Student Lodges", dbValue: "student_lodge", group: "student" },
  { slug: "hostel", label: "Hostel", pluralLabel: "Hostels", dbValue: "hostel", group: "student" },
  { slug: "shop-space", label: "Shop Space", pluralLabel: "Shop Spaces", dbValue: "shop", group: "commercial" },
  { slug: "office-space", label: "Office Space", pluralLabel: "Office Spaces", dbValue: "office", group: "commercial" },
  { slug: "warehouse", label: "Warehouse", pluralLabel: "Warehouses", dbValue: "warehouse", group: "commercial" },
  { slug: "land", label: "Land", pluralLabel: "Land Plots", dbValue: "land", listingType: "sale", group: "land" },
  { slug: "shortlet-apartment", label: "Shortlet Apartment", pluralLabel: "Shortlet Apartments", dbValue: "shortlet_apt", listingType: "shortlet", group: "shortlet" },
  { slug: "serviced-apartment", label: "Serviced Apartment", pluralLabel: "Serviced Apartments", dbValue: "hotel_apt", listingType: "shortlet", group: "shortlet" },
];

const bySlug = new Map(SEO_PROPERTY_TYPES.map((t) => [t.slug, t]));

export function resolveSeoPropertyType(slug: string): SeoPropertyType | null {
  return bySlug.get(slug) ?? null;
}

/** Top types for neighborhood pages — avoids combinatorial explosion */
export const PRIORITY_PROPERTY_TYPE_SLUGS = [
  "self-contain",
  "2-bedroom-flat",
  "mini-flat",
  "room-and-parlour",
  "shop-space",
  "student-lodge",
  "shortlet-apartment",
  "duplex",
] as const;
