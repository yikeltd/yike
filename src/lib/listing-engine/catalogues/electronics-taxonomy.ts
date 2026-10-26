/**
 * Nigeria marketplace electronics brand & model catalogues by product category.
 * Stable ids = display labels for brand/model text fields (API stores strings).
 */
import type { FieldOption } from "../types";
import type { CatalogueEntry } from "./types";

function opts(entries: readonly CatalogueEntry[]): FieldOption[] {
  return entries.map((e) => ({ value: e.id, label: e.label }));
}

const PHONE_BRANDS: CatalogueEntry[] = [
  { id: "Apple", label: "Apple", aliases: ["iphone"] },
  { id: "Samsung", label: "Samsung", aliases: ["galaxy"] },
  { id: "Tecno", label: "Tecno" },
  { id: "Infinix", label: "Infinix" },
  { id: "Xiaomi", label: "Xiaomi", aliases: ["redmi"] },
  { id: "Google", label: "Google", aliases: ["pixel"] },
  { id: "Oppo", label: "Oppo" },
  { id: "Vivo", label: "Vivo" },
  { id: "Huawei", label: "Huawei" },
  { id: "Nokia", label: "Nokia" },
  { id: "Itel", label: "Itel" },
  { id: "Realme", label: "Realme" },
  { id: "OnePlus", label: "OnePlus" },
];

const COMPUTER_BRANDS: CatalogueEntry[] = [
  { id: "HP", label: "HP" },
  { id: "Dell", label: "Dell" },
  { id: "Lenovo", label: "Lenovo" },
  { id: "Apple", label: "Apple", aliases: ["macbook"] },
  { id: "Asus", label: "Asus" },
  { id: "Acer", label: "Acer" },
  { id: "Microsoft", label: "Microsoft", aliases: ["surface"] },
  { id: "MSI", label: "MSI" },
];

const TV_BRANDS: CatalogueEntry[] = [
  { id: "Samsung", label: "Samsung" },
  { id: "LG", label: "LG" },
  { id: "Sony", label: "Sony" },
  { id: "Hisense", label: "Hisense" },
  { id: "TCL", label: "TCL" },
  { id: "Panasonic", label: "Panasonic" },
];

const GENERATOR_BRANDS: CatalogueEntry[] = [
  { id: "Sumec Firman", label: "Sumec Firman", aliases: ["firman"] },
  { id: "Mikano", label: "Mikano" },
  { id: "Honda", label: "Honda" },
  { id: "Elepa", label: "Elepa" },
  { id: "Thermocool", label: "Thermocool" },
  { id: "Lutian", label: "Lutian" },
  { id: "Perkins", label: "Perkins" },
];

const APPLIANCE_BRANDS: CatalogueEntry[] = [
  { id: "LG", label: "LG" },
  { id: "Samsung", label: "Samsung" },
  { id: "Haier Thermocool", label: "Haier Thermocool", aliases: ["thermocool"] },
  { id: "Hisense", label: "Hisense" },
  { id: "Binatone", label: "Binatone" },
  { id: "Panasonic", label: "Panasonic" },
];

const GENERIC_BRANDS: CatalogueEntry[] = [
  { id: "Samsung", label: "Samsung" },
  { id: "LG", label: "LG" },
  { id: "Sony", label: "Sony" },
  { id: "Other", label: "Other / not listed" },
];

export const ELECTRONICS_BRANDS_BY_CATEGORY: Record<string, readonly CatalogueEntry[]> = {
  phones_tablets: PHONE_BRANDS,
  computers: COMPUTER_BRANDS,
  gaming: COMPUTER_BRANDS,
  tv_audio: TV_BRANDS,
  generators: GENERATOR_BRANDS,
  inverters_batteries: GENERATOR_BRANDS,
  solar_equipment: GENERATOR_BRANDS,
  refrigerators_freezers: APPLIANCE_BRANDS,
  home_appliances: APPLIANCE_BRANDS,
  cameras: [{ id: "Canon", label: "Canon" }, { id: "Nikon", label: "Nikon" }, { id: "Sony", label: "Sony" }],
  other_electronics: GENERIC_BRANDS,
};

const phoneModels: Record<string, CatalogueEntry[]> = {
  Apple: [
    { id: "iPhone 15 Pro Max", label: "iPhone 15 Pro Max" },
    { id: "iPhone 15 Pro", label: "iPhone 15 Pro" },
    { id: "iPhone 15", label: "iPhone 15" },
    { id: "iPhone 14", label: "iPhone 14" },
    { id: "iPhone 13", label: "iPhone 13" },
    { id: "iPhone SE", label: "iPhone SE" },
  ],
  Samsung: [
    { id: "Galaxy S24 Ultra", label: "Galaxy S24 Ultra" },
    { id: "Galaxy S24", label: "Galaxy S24" },
    { id: "Galaxy A54", label: "Galaxy A54" },
    { id: "Galaxy A34", label: "Galaxy A34" },
    { id: "Galaxy A14", label: "Galaxy A14" },
  ],
  Tecno: [
    { id: "Camon 30", label: "Camon 30" },
    { id: "Spark 20", label: "Spark 20" },
    { id: "Pop 8", label: "Pop 8" },
  ],
  Infinix: [
    { id: "Note 40", label: "Note 40" },
    { id: "Hot 40", label: "Hot 40" },
    { id: "Smart 8", label: "Smart 8" },
  ],
};

const computerModels: Record<string, CatalogueEntry[]> = {
  HP: [
    { id: "EliteBook 840 G8", label: "EliteBook 840 G8" },
    { id: "Pavilion 15", label: "Pavilion 15" },
    { id: "ProBook 450 G9", label: "ProBook 450 G9" },
  ],
  Dell: [
    { id: "Latitude 5420", label: "Latitude 5420" },
    { id: "Inspiron 15", label: "Inspiron 15" },
    { id: "XPS 13", label: "XPS 13" },
  ],
  Lenovo: [
    { id: "ThinkPad T14", label: "ThinkPad T14" },
    { id: "IdeaPad 3", label: "IdeaPad 3" },
  ],
  Apple: [
    { id: "MacBook Air M2", label: "MacBook Air M2" },
    { id: "MacBook Pro 14", label: "MacBook Pro 14" },
  ],
};

const generatorModels: Record<string, CatalogueEntry[]> = {
  "Sumec Firman": [
    { id: "SPG 7500E2", label: "SPG 7500E2 (5.5kVA)" },
    { id: "SPG 3000E2", label: "SPG 3000E2 (2.8kVA)" },
  ],
  Mikano: [
    { id: "MKN 5.5kVA", label: "MKN 5.5kVA" },
    { id: "MKN 7.5kVA", label: "MKN 7.5kVA" },
  ],
};

export const ELECTRONICS_MODELS_BY_CATEGORY: Record<
  string,
  Record<string, readonly CatalogueEntry[]>
> = {
  phones_tablets: phoneModels,
  computers: computerModels,
  gaming: computerModels,
  generators: generatorModels,
  inverters_batteries: generatorModels,
};

export function electronicsBrandsForCategory(categoryId: string): FieldOption[] {
  const list = ELECTRONICS_BRANDS_BY_CATEGORY[categoryId] ?? GENERIC_BRANDS;
  return opts(list);
}

export function electronicsModelsForBrand(
  categoryId: string,
  brand: string,
): FieldOption[] {
  const b = brand.trim();
  if (!b) return [];
  const byCat = ELECTRONICS_MODELS_BY_CATEGORY[categoryId];
  if (!byCat) return [];
  const exact = byCat[b];
  if (exact) return opts(exact);
  const fold = Object.entries(byCat).find(
    ([key]) => key.toLowerCase() === b.toLowerCase(),
  );
  return fold ? opts(fold[1]) : [];
}

export function resolveElectronicsBrandFromAlias(
  categoryId: string,
  token: string,
): string | null {
  const t = token.toLowerCase();
  const brands = ELECTRONICS_BRANDS_BY_CATEGORY[categoryId] ?? [];
  for (const b of brands) {
    if (b.id.toLowerCase() === t || b.label.toLowerCase() === t) return b.id;
    for (const a of b.aliases ?? []) {
      if (t.includes(a.toLowerCase())) return b.id;
    }
  }
  return null;
}

export function countElectronicsCatalogueStats(): {
  categories: number;
  brands: number;
  models: number;
} {
  const categories = Object.keys(ELECTRONICS_BRANDS_BY_CATEGORY).length;
  let brands = 0;
  let models = 0;
  for (const list of Object.values(ELECTRONICS_BRANDS_BY_CATEGORY)) {
    brands += list.length;
  }
  for (const byBrand of Object.values(ELECTRONICS_MODELS_BY_CATEGORY)) {
    for (const list of Object.values(byBrand)) {
      models += list.length;
    }
  }
  return { categories, brands, models };
}
