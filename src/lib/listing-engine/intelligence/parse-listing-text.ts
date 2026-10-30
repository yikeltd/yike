/**
 * Deterministic text parsing for listing creation — no LLM, no fabricated facts.
 * High-confidence matches align with catalogs; medium/low are suggestions only.
 */
import { PROPERTY_CATEGORIES } from "@/constants/propertyCategories";
import { LISTING_TYPES } from "@/constants/listingTypes";
import { NIGERIAN_STATES } from "@/constants/nigeriaLocations";
import { ELECTRONICS_CATEGORIES } from "@/lib/marketplace/electronics-specs";
import { resolveElectronicsBrandFromAlias } from "../catalogues/electronics-taxonomy";
import {
  VEHICLE_MAKE_TYPES,
  VEHICLE_MAKES,
} from "@/lib/marketplace/vehicle-makes";
import { VEHICLE_CONDITION_OPTIONS } from "@/lib/marketplace/vehicle-specs";
import type { CategoryManifest, ListingCategoryId, ListingValues } from "../types";
import type { CatalogMap } from "../catalogs/types";
import type { CategoryHint, ParseListingTextResult, ParsedFieldSuggestion } from "./types";

const ELECTRONICS_BRANDS = [
  "Apple",
  "Samsung",
  "Tecno",
  "Infinix",
  "Xiaomi",
  "Google",
  "Huawei",
  "Oppo",
  "Vivo",
  "Nokia",
  "Itel",
  "HP",
  "Dell",
  "Lenovo",
  "Asus",
  "Acer",
  "Microsoft",
  "Sony",
  "LG",
  "Thermocool",
  "Haier",
  "Mikano",
  "Firman",
  "Sumec",
  "Honda",
] as const;

function norm(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function wordBoundaryMatch(text: string, token: string): boolean {
  const re = new RegExp(`\\b${escapeRe(token)}\\b`, "i");
  return re.test(text);
}

export function detectMarketplaceCategory(text: string): CategoryHint | undefined {
  const t = norm(text);
  if (!t) return undefined;

  let vehicleScore = 0;
  let electronicsScore = 0;
  let propertyScore = 0;

  for (const make of VEHICLE_MAKES) {
    if (wordBoundaryMatch(t, make)) vehicleScore += 3;
  }
  if (/\b(km|mileage|odometer|vin|automatic|manual transmission|foreign used|tokunbo)\b/i.test(text)) {
    vehicleScore += 2;
  }
  if (/\b(excavator|tractor|bulldozer|forklift|truck|bus|motorcycle|tricycle|suv|sedan|pickup)\b/i.test(text)) {
    vehicleScore += 2;
  }

  if (/\b(iphone|ipad|samsung galaxy|macbook|laptop|generator|inverter|kva|android|smart tv|playstation|xbox)\b/i.test(text)) {
    electronicsScore += 3;
  }
  if (/\b(brand new|uk used|nigerian used)\b/i.test(text) && !/\b(bedroom|duplex|flat for rent)\b/i.test(text)) {
    electronicsScore += 1;
  }
  if (/\b(gb ram|storage|mah battery)\b/i.test(text)) electronicsScore += 2;

  if (/\b(bedroom|bedrooms|duplex|bungalow|flat for rent|for rent|for sale|shortlet|airbnb|sqm|plot of land|self contain)\b/i.test(text)) {
    propertyScore += 3;
  }
  if (/\b(estate|lekki|abuja|port harcourt|enugu|aba)\b/i.test(text) && propertyScore > 0) {
    propertyScore += 1;
  }

  const max = Math.max(vehicleScore, electronicsScore, propertyScore);
  if (max < 2) return undefined;

  if (vehicleScore === max && vehicleScore >= electronicsScore && vehicleScore >= propertyScore) {
    return { categoryId: "vehicle", confidence: vehicleScore >= 4 ? "high" : "medium" };
  }
  if (electronicsScore === max && electronicsScore >= propertyScore) {
    return { categoryId: "electronics", confidence: electronicsScore >= 4 ? "high" : "medium" };
  }
  if (propertyScore === max) {
    return { categoryId: "property", confidence: propertyScore >= 4 ? "high" : "medium" };
  }
  return undefined;
}

function parseYear(text: string): number | null {
  const m = text.match(/\b(19[89]\d|20[0-2]\d)\b/);
  if (!m) return null;
  const y = Number(m[1]);
  if (y < 1980 || y > new Date().getFullYear() + 1) return null;
  return y;
}

function parseBedrooms(text: string): number | null {
  const m = text.match(/\b(\d{1,2})\s*(?:bed(?:room)?s?|br)\b/i);
  if (!m) return null;
  const n = Number(m[1]);
  if (n < 0 || n > 20) return null;
  return n;
}

function parseStorageGb(text: string): string | null {
  const m = text.match(/\b(\d{2,4})\s*gb\b/i);
  if (!m) return null;
  return m[1]!;
}

function parseVehicleCategory(text: string): string | null {
  const t = norm(text);
  if (/\b(motorcycle|bike|okada|tricycle|keke)\b/.test(t)) return "motorcycle";
  if (/\b(excavator|digger)\b/.test(t)) return "excavator";
  if (/\b(tractor|farm)\b/.test(t)) return "tractor";
  if (/\b(forklift|loader|bulldozer|crane|heavy equipment)\b/.test(t)) return "heavy_equipment";
  if (/\b(bus|coaster|hiace)\b/.test(t)) return "bus";
  if (/\b(truck|lorry|tipper)\b/.test(t)) return "truck";
  if (/\b(pickup|pick up)\b/.test(t)) return "pickup_van";
  if (/\b(suv|jeep|crossover)\b/.test(t)) return "suv";
  if (/\b(sedan|saloon)\b/.test(t)) return "car";
  return null;
}

function parseElectronicsCategory(text: string): string | null {
  const t = norm(text);
  if (/\b(iphone|ipad|smartphone|android phone|samsung galaxy|tecno|infinix)\b/.test(t)) {
    return "phones_tablets";
  }
  if (/\b(laptop|macbook|notebook|desktop|imac|gaming pc)\b/.test(t)) return "computers";
  if (/\b(playstation|xbox|nintendo|ps5|ps4)\b/.test(t)) return "gaming";
  if (/\b(smart tv|television|soundbar|speaker|home theater)\b/.test(t)) return "tv_audio";
  if (/\b(generator|gen set|kva|mikano|firman)\b/.test(t)) return "generators";
  if (/\b(inverter|battery bank|ups)\b/.test(t)) return "inverters_batteries";
  if (/\b(solar panel|charge controller)\b/.test(t)) return "solar_equipment";
  if (/\b(fridge|freezer|refrigerator)\b/.test(t)) return "refrigerators_freezers";
  if (/\b(washing machine|microwave|blender|appliance)\b/.test(t)) return "home_appliances";
  if (/\b(camera|dslr|cctv)\b/.test(t)) return "cameras";
  return null;
}

function parseListingType(text: string): string | null {
  const t = norm(text);
  if (/\b(shortlet|airbnb|nightly|per night)\b/.test(t)) return "shortlet";
  if (/\b(for sale|to buy|outright sale|sale\b)\b/.test(t)) return "sale";
  if (/\b(for rent|to let|rental|per annum|per year)\b/.test(t)) return "rent";
  if (/\b(lease)\b/.test(t)) return "lease";
  return null;
}

function parsePropertyType(text: string, listingType: string | null): { value: string; confidence: "high" | "medium" } | null {
  const t = norm(text);
  for (const cat of PROPERTY_CATEGORIES) {
    const label = norm(cat.label);
    if (t.includes(label)) {
      return { value: cat.value, confidence: "high" };
    }
  }
  if (/\bduplex\b/.test(t)) return { value: "duplex", confidence: "high" };
  if (/\bbungalow\b/.test(t)) return { value: "bungalow", confidence: "high" };
  if (/\bself contain\b/.test(t)) return { value: "self_contain", confidence: "high" };
  if (/\bland\b/.test(t) && listingType !== "rent") {
    return { value: "land", confidence: "medium" };
  }
  if (/\bshop\b/.test(t)) return { value: "shop", confidence: "medium" };
  if (/\boffice\b/.test(t)) return { value: "office", confidence: "medium" };
  return null;
}

function parseConditionVehicle(text: string): string | null {
  const t = norm(text);
  for (const opt of VEHICLE_CONDITION_OPTIONS) {
    if (t.includes(norm(opt.label))) return opt.value;
  }
  if (/\b(foreign used|tokunbo|tokunbo)\b/.test(t)) return "foreign_used";
  if (/\b(local used|nigerian used)\b/.test(t)) return "nigerian_used";
  if (/\b(brand new|new)\b/.test(t)) return "brand_new";
  return null;
}

function parseConditionElectronics(text: string): string | null {
  const t = norm(text);
  if (/\b(brand new|sealed|new in box)\b/.test(t)) return "brand_new";
  if (/\b(uk used|foreign used|tokunbo)\b/.test(t)) return "foreign_used";
  if (/\b(nigerian used|locally used)\b/.test(t)) return "nigerian_used";
  if (/\b(refurb)\b/.test(t)) return "refurbished";
  return null;
}

function parseTransmission(text: string): string | null {
  const t = norm(text);
  if (/\bautomatic\b/.test(t)) return "automatic";
  if (/\bmanual\b/.test(t)) return "manual";
  return null;
}

function parseFuel(text: string): string | null {
  const t = norm(text);
  if (/\bdiesel\b/.test(t)) return "diesel";
  if (/\bpetrol\b/.test(t)) return "petrol";
  if (/\bhybrid\b/.test(t)) return "hybrid";
  if (/\belectric\b/.test(t)) return "electric";
  return null;
}

function parseMileage(text: string): string | null {
  const m = text.match(/\b([\d,]{2,7})\s*km\b/i);
  if (!m) return null;
  return m[1]!.replace(/,/g, "");
}

function findMakeModel(text: string): { make: string; model: string | null; confidence: "high" | "medium" } | null {
  const t = text;
  for (const make of VEHICLE_MAKES) {
    if (!wordBoundaryMatch(t, make)) continue;
    const models = VEHICLE_MAKE_TYPES[make] ?? [];
    for (const model of models) {
      if (wordBoundaryMatch(t, model)) {
        return { make, model, confidence: "high" };
      }
    }
    return { make, model: null, confidence: "medium" };
  }
  return null;
}

function findElectronicsBrand(text: string): string | null {
  for (const brand of ELECTRONICS_BRANDS) {
    if (wordBoundaryMatch(text, brand)) return brand;
  }
  if (/\biphone\b/i.test(text)) return "Apple";
  if (/\bmacbook\b/i.test(text)) return "Apple";
  if (/\bgalaxy\b/i.test(text)) return "Samsung";
  return null;
}

function findState(text: string): string | null {
  for (const state of NIGERIAN_STATES) {
    if (wordBoundaryMatch(text, state)) return state;
  }
  return null;
}

function catalogHasValue(
  manifest: CategoryManifest,
  fieldId: string,
  value: string,
  values: ListingValues,
  catalogs: CatalogMap,
): boolean {
  const field = manifest.fields.find((f) => f.id === fieldId);
  if (!field?.dependsOn?.optionsFrom) return true;
  const provider = catalogs[field.dependsOn.optionsFrom];
  if (!provider) return true;
  const opts = provider({ ...values, [fieldId]: value });
  return opts.some((o) => o.value === value);
}

/** Parse free text into field suggestions for the active category manifest. */
export function parseListingText(
  manifest: CategoryManifest,
  text: string,
  values: ListingValues,
  catalogs: CatalogMap,
): ParseListingTextResult {
  const trimmed = text.trim();
  const fields: ParsedFieldSuggestion[] = [];
  const categoryHint = detectMarketplaceCategory(trimmed);

  if (!trimmed) {
    return { categoryHint, fields };
  }

  const year = parseYear(trimmed);
  if (year != null && manifest.fields.some((f) => f.id === "year")) {
    fields.push({ fieldId: "year", value: year, confidence: "high" });
  }

  const state = findState(trimmed);
  if (state && manifest.fields.some((f) => f.id === "state")) {
    fields.push({ fieldId: "state", value: state, confidence: "high", label: state });
  }

  if (manifest.id === "vehicle") {
    const cat = parseVehicleCategory(trimmed);
    if (cat && catalogHasValue(manifest, "auto_category", cat, values, catalogs)) {
      fields.push({
        fieldId: "auto_category",
        value: cat,
        confidence: "medium",
        label: cat.replace(/_/g, " "),
      });
    }
    const mm = findMakeModel(trimmed);
    if (mm) {
      fields.push({
        fieldId: "make",
        value: mm.make,
        confidence: mm.confidence,
        label: mm.make,
      });
      if (mm.model && catalogHasValue(manifest, "model", mm.model, { ...values, make: mm.make }, catalogs)) {
        fields.push({
          fieldId: "model",
          value: mm.model,
          confidence: "high",
          label: mm.model,
        });
      }
    }
    const cond = parseConditionVehicle(trimmed);
    if (cond) {
      fields.push({ fieldId: "vehicle_condition", value: cond, confidence: "medium" });
    }
    const trans = parseTransmission(trimmed);
    if (trans) {
      fields.push({ fieldId: "transmission", value: trans, confidence: "high" });
    }
    const fuel = parseFuel(trimmed);
    if (fuel) {
      fields.push({ fieldId: "fuel_type", value: fuel, confidence: "high" });
    }
    const mileage = parseMileage(trimmed);
    if (mileage) {
      fields.push({ fieldId: "mileage", value: mileage, confidence: "high" });
    }
  }

  if (manifest.id === "electronics") {
    const cat = parseElectronicsCategory(trimmed);
    if (cat) {
      const known = ELECTRONICS_CATEGORIES.some((c) => c.id === cat);
      fields.push({
        fieldId: "auto_category",
        value: cat,
        confidence: known ? "high" : "medium",
      });
    }
    const catId = String(values.auto_category ?? parseElectronicsCategory(trimmed) ?? "");
    const brand =
      findElectronicsBrand(trimmed) ||
      (catId ? resolveElectronicsBrandFromAlias(catId, trimmed) : null);
    if (brand) {
      fields.push({ fieldId: "brand", value: brand, confidence: "high", label: brand });
    }
    const storage = parseStorageGb(trimmed);
    if (storage) {
      fields.push({ fieldId: "storage_gb", value: storage, confidence: "high" });
    }
    const cond = parseConditionElectronics(trimmed);
    if (cond) {
      fields.push({ fieldId: "condition", value: cond, confidence: "medium" });
    }
    const iphoneModel = trimmed.match(/\biphone\s*(se|\d{1,2}\s*(?:pro\s*max|pro|plus|mini)?)/i);
    if (iphoneModel && !fields.some((f) => f.fieldId === "model")) {
      fields.push({
        fieldId: "model",
        value: `iPhone ${iphoneModel[1]!.replace(/\s+/g, " ").trim()}`,
        confidence: "medium",
      });
    }
  }

  if (manifest.id === "property") {
    const listingType = parseListingType(trimmed);
    if (listingType && LISTING_TYPES.some((t) => t.value === listingType)) {
      fields.push({ fieldId: "listing_type", value: listingType, confidence: "medium" });
    }
    const pt = parsePropertyType(trimmed, listingType);
    if (pt && catalogHasValue(manifest, "property_type", pt.value, { ...values, listing_type: listingType ?? values.listing_type }, catalogs)) {
      fields.push({
        fieldId: "property_type",
        value: pt.value,
        confidence: pt.confidence,
      });
    }
    const beds = parseBedrooms(trimmed);
    if (beds != null) {
      fields.push({ fieldId: "bedrooms", value: beds, confidence: "high" });
    }
  }

  return { categoryHint, fields };
}

export function firstLineAsTitle(text: string, maxLen = 120): string {
  const line = text.split(/\n/)[0]?.trim() ?? "";
  return line.slice(0, maxLen);
}
