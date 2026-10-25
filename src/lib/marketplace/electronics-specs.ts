/** Electronics vertical taxonomy — stored in `properties.auto_category`. */

export type ElectronicsCategoryId =
  | "phones_tablets"
  | "computers"
  | "tv_audio"
  | "home_appliances"
  | "refrigerators_freezers"
  | "generators"
  | "inverters_batteries"
  | "solar_equipment"
  | "cameras"
  | "gaming"
  | "other_electronics";

export const ELECTRONICS_CATEGORIES: {
  id: ElectronicsCategoryId;
  label: string;
  description: string;
}[] = [
  { id: "phones_tablets", label: "Phones & Tablets", description: "Smartphones, iPads, accessories" },
  { id: "computers", label: "Computers & Laptops", description: "Laptops, desktops, monitors" },
  { id: "tv_audio", label: "TVs & Audio", description: "Televisions, sound systems, speakers" },
  { id: "home_appliances", label: "Home Appliances", description: "Washers, microwaves, small appliances" },
  { id: "refrigerators_freezers", label: "Refrigerators & Freezers", description: "Fridges, freezers, coolers" },
  { id: "generators", label: "Generators", description: "Petrol, diesel, inverter generators" },
  { id: "inverters_batteries", label: "Inverters & Batteries", description: "Inverters, UPS, battery banks" },
  { id: "solar_equipment", label: "Solar Equipment", description: "Panels, charge controllers, kits" },
  { id: "cameras", label: "Cameras", description: "DSLR, CCTV, action cameras" },
  { id: "gaming", label: "Gaming", description: "Consoles, controllers, gaming PCs" },
  { id: "other_electronics", label: "Other Electronics", description: "Other gadgets and equipment" },
];

/** All condition ids accepted by the electronics create API (includes legacy values). */
export const ELECTRONICS_CONDITIONS = [
  { id: "brand_new", label: "Brand new" },
  { id: "open_box", label: "Open box" },
  { id: "refurbished", label: "Refurbished" },
  { id: "foreign_used", label: "UK used" },
  { id: "nigerian_used", label: "Nigerian used" },
  { id: "for_parts", label: "For parts" },
] as const;

/** Options shown when creating a listing — Nigeria-focused, no legacy-only ids. */
export const ELECTRONICS_SELLER_CONDITIONS = ELECTRONICS_CONDITIONS.filter(
  (c) => c.id !== "open_box" && c.id !== "for_parts",
);

export const ELECTRONICS_WARRANTY_STATUS = [
  { id: "with_warranty", label: "With warranty" },
  { id: "no_warranty", label: "No warranty" },
  { id: "not_sure", label: "Not sure" },
] as const;

export type ElectronicsWarrantyStatusId =
  (typeof ELECTRONICS_WARRANTY_STATUS)[number]["id"];

export function electronicsWarrantyStatusLabel(
  id: string | null | undefined,
): string | null {
  if (!id) return null;
  return ELECTRONICS_WARRANTY_STATUS.find((w) => w.id === id)?.label ?? null;
}

export function electronicsCategoryLabel(id: string | null | undefined): string {
  const hit = ELECTRONICS_CATEGORIES.find((c) => c.id === id);
  return hit?.label ?? "Electronics";
}
