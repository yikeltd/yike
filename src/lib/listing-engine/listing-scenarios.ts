/**
 * Representative listing form states for completion metrics (diverse subcategories).
 */
import type { ListingValues } from "./types";

export type ListingScenario = {
  id: string;
  vertical: "property" | "vehicle" | "electronics";
  label: string;
  values: ListingValues;
};

export const LISTING_SCENARIOS: ListingScenario[] = [
  {
    id: "property-rent-flat",
    vertical: "property",
    label: "3-bed flat for rent (Lagos)",
    values: {
      listing_type: "rent",
      property_type: "flat_3",
      bedrooms: "3",
      bathrooms: "3",
      toilets: "3",
      amenities: ["parking", "security"],
      state: "Lagos",
      city: "Lekki",
      area: "Lekki Phase 1",
      title: "3 Bedroom Flat Lekki",
      price: 4_500_000,
      description: "Serviced flat with parking.",
    },
  },
  {
    id: "property-sale-land",
    vertical: "property",
    label: "Land for sale (Enugu)",
    values: {
      listing_type: "sale",
      property_type: "land",
      amenities: [],
      state: "Enugu",
      city: "Enugu",
      area: "Independence Layout",
      title: "Dry Land Independence Layout",
      price: 18_000_000,
      description: "Fenced plot with access road.",
    },
  },
  {
    id: "property-rent-commercial",
    vertical: "property",
    label: "Commercial shop for rent (Aba)",
    values: {
      listing_type: "rent",
      property_type: "shop",
      amenities: ["security"],
      state: "Abia",
      city: "Aba",
      area: "Ariaria",
      title: "Shop Space Ariaria Market",
      price: 800_000,
      payment_period: "yearly",
      description: "Ground floor shop front.",
    },
  },
  {
    id: "vehicle-car",
    vertical: "vehicle",
    label: "Toyota Camry car",
    values: {
      auto_category: "car",
      make: "Toyota",
      model: "Camry",
      year: "2019",
      vehicle_condition: "foreign_used",
      transmission: "automatic",
      fuel_type: "petrol",
      state: "Lagos",
      city: "Ikeja",
      area: "Maryland",
      title: "Toyota Camry 2019",
      price: 14_500_000,
      description: "Clean foreign used.",
    },
  },
  {
    id: "vehicle-motorcycle",
    vertical: "vehicle",
    label: "Bajaj motorcycle",
    values: {
      auto_category: "motorcycle_tricycle",
      make: "Bajaj",
      model: "Boxer",
      year: "2022",
      vehicle_condition: "nigerian_used",
      transmission: "manual",
      fuel_type: "petrol",
      state: "Kano",
      city: "Kano",
      area: "Nassarawa",
      title: "Bajaj Boxer 2022",
      price: 450_000,
      description: "Registered with papers.",
    },
  },
  {
    id: "vehicle-pickup",
    vertical: "vehicle",
    label: "Ford Ranger pickup",
    values: {
      auto_category: "pickup_van",
      make: "Ford",
      model: "Ranger",
      year: "2018",
      vehicle_condition: "foreign_used",
      transmission: "automatic",
      fuel_type: "diesel",
      state: "Lagos",
      city: "Apapa",
      area: "Apapa GRA",
      title: "Ford Ranger 2018",
      price: 12_000_000,
      description: "Clean pickup for logistics.",
    },
  },
  {
    id: "electronics-phone",
    vertical: "electronics",
    label: "Samsung phone",
    values: {
      auto_category: "phones_tablets",
      brand: "Samsung",
      model: "Galaxy A54",
      condition: "foreign_used",
      warranty_status: "no_warranty",
      storage_gb: "128",
      state: "Lagos",
      city: "Ikeja",
      area: "Maryland",
      title: "Samsung Galaxy A54",
      price: 680_000,
      description: "UK used with box.",
    },
  },
  {
    id: "electronics-generator",
    vertical: "electronics",
    label: "Sumec Firman generator",
    values: {
      auto_category: "generators",
      brand: "Sumec Firman",
      model: "SPG 7500E2",
      condition: "brand_new",
      warranty_status: "with_warranty",
      power_kva: "5.5",
      state: "Lagos",
      city: "Surulere",
      area: "Aguda",
      title: "Firman 5.5kVA Generator",
      price: 520_000,
      description: "Brand new with warranty card.",
    },
  },
  {
    id: "electronics-fridge",
    vertical: "electronics",
    label: "LG refrigerator",
    values: {
      auto_category: "refrigerators_freezers",
      brand: "LG",
      model: "LG 450L Double Door",
      condition: "foreign_used",
      warranty_status: "no_warranty",
      capacity_liters: "450",
      state: "Rivers",
      city: "Port Harcourt",
      area: "GRA",
      title: "LG 450L Fridge",
      price: 380_000,
      description: "Working perfectly.",
    },
  },
  {
    id: "electronics-appliance",
    vertical: "electronics",
    label: "Haier Thermocool washing machine",
    values: {
      auto_category: "home_appliances",
      brand: "Haier Thermocool",
      model: "Front Load 7kg",
      condition: "brand_new",
      warranty_status: "with_warranty",
      state: "FCT",
      city: "Abuja",
      area: "Gwarinpa",
      title: "Thermocool 7kg Washer",
      price: 295_000,
      description: "New in box.",
    },
  },
];

/** @deprecated Use LISTING_SCENARIOS or scenario by id */
export function representativeListingValues(
  vertical: "property" | "vehicle" | "electronics",
): ListingValues {
  const scenario = LISTING_SCENARIOS.find((s) => s.vertical === vertical);
  return scenario?.values ?? {};
}
