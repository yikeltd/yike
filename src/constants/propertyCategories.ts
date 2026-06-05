/** Structured property categories — used in search, listing forms, and future filters */

export type PropertyCategoryGroup =
  | "residential"
  | "commercial"
  | "land"
  | "shortlet"
  | "student";

export type PropertyCategory = {
  value: string;
  label: string;
  group: PropertyCategoryGroup;
};

export const PROPERTY_CATEGORY_GROUPS: {
  id: PropertyCategoryGroup;
  label: string;
}[] = [
  { id: "residential", label: "Residential" },
  { id: "commercial", label: "Commercial" },
  { id: "land", label: "Land" },
  { id: "shortlet", label: "Shortlet" },
  { id: "student", label: "Student" },
];

export const PROPERTY_CATEGORIES: PropertyCategory[] = [
  // Residential
  { value: "self_contain", label: "Self Contain", group: "residential" },
  { value: "room", label: "Room and Parlour", group: "residential" },
  { value: "mini_flat", label: "Mini Flat", group: "residential" },
  { value: "flat_2", label: "2 Bedroom Flat", group: "residential" },
  { value: "flat_3", label: "3 Bedroom Flat", group: "residential" },
  { value: "flat", label: "Flat", group: "residential" },
  { value: "duplex", label: "Duplex", group: "residential" },
  { value: "terrace_duplex", label: "Terrace Duplex", group: "residential" },
  { value: "detached_duplex", label: "Detached Duplex", group: "residential" },
  { value: "bungalow", label: "Bungalow", group: "residential" },
  { value: "mansion", label: "Mansion", group: "residential" },
  // Commercial
  { value: "shop", label: "Shop", group: "commercial" },
  { value: "office", label: "Office Space", group: "commercial" },
  { value: "plaza", label: "Plaza", group: "commercial" },
  { value: "warehouse", label: "Warehouse", group: "commercial" },
  { value: "event_center", label: "Event Center", group: "commercial" },
  // Land
  { value: "land_residential", label: "Residential Land", group: "land" },
  { value: "land_commercial", label: "Commercial Land", group: "land" },
  { value: "land_farm", label: "Farm Land", group: "land" },
  { value: "land", label: "Land", group: "land" },
  // Shortlet
  { value: "shortlet_apt", label: "Shortlet Apartment", group: "shortlet" },
  { value: "airbnb", label: "Airbnb", group: "shortlet" },
  { value: "hotel_apt", label: "Hotel Apartment", group: "shortlet" },
  { value: "guest_house", label: "Guest House", group: "shortlet" },
  // Student
  { value: "hostel", label: "Hostel", group: "student" },
  { value: "student_lodge", label: "Student Lodge", group: "student" },
  { value: "shared_apt", label: "Shared Apartment", group: "student" },
];

/** Flat list for legacy selects — deduped by value */
export const PROPERTY_TYPES = PROPERTY_CATEGORIES.map((c) => ({
  value: c.value,
  label: c.label,
}));

export function getCategoriesByGroup(group: PropertyCategoryGroup) {
  return PROPERTY_CATEGORIES.filter((c) => c.group === group);
}

export function getPropertyCategoryLabel(value: string | null): string {
  if (!value) return "Property";
  return (
    PROPERTY_CATEGORIES.find((c) => c.value === value)?.label ??
    value.replace(/_/g, " ")
  );
}
