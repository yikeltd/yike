export const SITE_NAME = "Yike";
export const SITE_URL = "https://yike.ng";
export const SITE_TAGLINE =
  "The fastest and safest way to find real houses in Nigeria.";

export const SOCIAL_LINKS = {
  facebook: "https://facebook.com/realyike",
  x: "https://x.com/real_yike",
  youtube: "https://youtube.com/@real_yike",
  tiktok: "https://tiktok.com/@real_yike",
} as const;

export const LISTING_TYPES = [
  { value: "rent", label: "Rent" },
  { value: "sale", label: "Buy" },
  { value: "shortlet", label: "Shortlet" },
] as const;

export {
  PROPERTY_TYPES,
  PROPERTY_CATEGORIES,
  PROPERTY_CATEGORY_GROUPS,
  getPropertyCategoryLabel,
  getCategoriesByGroup,
} from "@/constants/propertyCategories";

export const PAYMENT_PERIODS = [
  { value: "yearly", label: "Per Year" },
  { value: "monthly", label: "Per Month" },
  { value: "weekly", label: "Per Week" },
  { value: "daily", label: "Per Day" },
  { value: "total", label: "Total Price" },
] as const;

export const BUDGET_RANGES = [
  { label: "Any budget", min: 0, max: null },
  { label: "Under ₦200k/yr", min: 0, max: 200000 },
  { label: "₦200k – ₦500k", min: 200000, max: 500000 },
  { label: "₦500k – ₦1M", min: 500000, max: 1000000 },
  { label: "₦1M – ₦2M", min: 1000000, max: 2000000 },
  { label: "₦2M – ₦5M", min: 2000000, max: 5000000 },
  { label: "₦5M – ₦10M", min: 5000000, max: 10000000 },
  { label: "₦10M+", min: 10000000, max: null },
] as const;

export const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
] as const;

export {
  nigeriaLocations,
  POPULAR_CITIES,
  CITY_AREAS,
  getStates,
  getCitiesForState,
  getAreasForCity,
  getStateForCity,
  getAllCities,
  getAreasForSearchCity,
} from "@/constants/nigeriaLocations";

export { TRENDING_SEARCH_LINKS, POPULAR_AREAS } from "@/constants/popularAreas";
export { TRENDING_CITIES } from "@/constants/trendingCities";
export { SAFETY_MESSAGES, getDailySafetyMessage } from "@/constants/safetyMessages";
export { AREA_PROFILES, getAreaProfiles, getAreasByProfile } from "@/constants/areaProfiles";

export const REPORT_REASONS = [
  "Fake listing",
  "Already rented",
  "Wrong price",
  "Scam / asks for fee before viewing",
  "Duplicate listing",
  "Other",
] as const;

export const SAFETY_WARNING =
  "Never pay inspection fees before seeing a property. Meet at the property, verify documents, and pay only after you are satisfied.";

export const MIN_LISTING_IMAGES = 3;
