import { NIGERIAN_STATES } from "@/constants/nigeriaLocations";
import { ELECTRONICS_CATEGORIES } from "@/lib/marketplace/electronics-specs";
import { VEHICLE_MAKES, VEHICLE_MAKE_TYPES } from "@/lib/marketplace/vehicle-makes";
import { PROPERTY_CATEGORIES } from "@/constants/propertyCategories";
import { countElectronicsCatalogueStats } from "./electronics-taxonomy";
import type { CatalogueCoverageReport } from "./types";

export function catalogueCoverageReports(): CatalogueCoverageReport[] {
  const electronics = countElectronicsCatalogueStats();
  const vehicleModels = Object.values(VEHICLE_MAKE_TYPES).reduce(
    (n, arr) => n + arr.length,
    0,
  );

  return [
    {
      vertical: "property",
      categories: PROPERTY_CATEGORIES.length,
      brandsOrMakes: 0,
      models: 0,
      locationStates: NIGERIAN_STATES.length,
      notes: [
        "Listing types and property types via LISTING_TYPES + propertyCategories.",
        "Cities/areas via nigeriaLocations (state → city → area cascade).",
        "Bedrooms/bathrooms use preset select chips (0–12).",
        "Title, description, price, and optional landmark remain typed fields.",
      ],
    },
    {
      vertical: "vehicle",
      categories: 0,
      brandsOrMakes: VEHICLE_MAKES.length,
      models: vehicleModels,
      locationStates: NIGERIAN_STATES.length,
      notes: [
        "Makes/models from vehicle-makes.ts (Nigeria marketplace catalog).",
        "Vehicle type, transmission, fuel, condition from vehicle-specs.",
        "Years via preset select (1980–current+1).",
        "Trim and mileage remain typed where applicable.",
      ],
    },
    {
      vertical: "electronics",
      categories: ELECTRONICS_CATEGORIES.length,
      brandsOrMakes: electronics.brands,
      models: electronics.models,
      locationStates: NIGERIAN_STATES.length,
      notes: [
        "Brand/model catalogues cover phones, computers, TVs, generators, appliances.",
        "Gaps: some home_appliances / solar SKUs still use custom model entry.",
        "Spec presets for storage, RAM, kVA, screen size, fridge capacity.",
      ],
    },
  ];
}
