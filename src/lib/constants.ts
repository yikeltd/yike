export const SITE_NAME = "Yike";
export const SITE_URL = "https://yike.ng";
export const SITE_TAGLINE =
  "Find real homes in Nigeria — swipe verified listings and chat agents on WhatsApp.";

export const COMPANY_LEGAL_NAME = "YIKE LTD";
export const COMPANY_DISPLAY_NAME = "Yike Ltd.";
export const COMPANY_RC = "RC-9552998";
export const COMPANY_EMAIL = "hello@yike.ng";

/** Official Yike support WhatsApp (international format, no +). */
export const YIKE_SUPPORT_WHATSAPP = "2348035143299";

/** @deprecated HomeHeroPitch removed — kept for reference only */
export const HOME_HERO_HEADLINE = "Discover trusted homes across Nigeria.";
export const HOME_HERO_SUBLINE =
  "Swipe verified listings and connect with agents on WhatsApp.";

export const COMPANY_DESCRIPTION =
  "Yike is a Nigerian real estate marketplace helping users discover verified apartments, houses, shortlets, land, and commercial properties through a mobile-first browsing experience.";

export const SOCIAL_LINKS = {
  facebook: "https://www.facebook.com/realyike/",
  instagram: "https://www.instagram.com/real_yike/",
  x: "https://x.com/real_yike",
  youtube: "https://www.youtube.com/@real_yike",
  tiktok: "https://www.tiktok.com/@real_yike",
} as const;

export { LISTING_TYPES } from "@/constants/listingTypes";

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
  { label: "Any Budget", min: 0, max: null },
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

export {
  STATE_CAPITALS,
  getAllCitiesComplete,
  getAllCitiesForState,
  getAllStates,
} from "@/constants/nigeriaAllCities";

export { TRENDING_SEARCH_LINKS, POPULAR_AREAS } from "@/constants/popularAreas";
export { TRENDING_CITIES } from "@/constants/trendingCities";
export { SAFETY_MESSAGES, getDailySafetyMessage } from "@/constants/safetyMessages";
export { AREA_PROFILES, getAreaProfiles, getAreasByProfile } from "@/constants/areaProfiles";

export const REPORT_REASONS = [
  "Fake listing",
  "Wrong price",
  "Already rented/sold",
  "Scam/fraud suspicion",
  "Duplicate listing",
  "Abusive agent",
  "Wrong location",
  "Misleading photos",
  "Spam",
  "Other",
] as const;

/** Unresolved report statuses for threshold automation. */
export const OPEN_REPORT_STATUSES = ["open", "pending"] as const;

export const SAFETY_WARNING =
  "Never pay inspection fees before seeing a property. Meet at the property, verify documents, and pay only after you are satisfied.";

export const MIN_LISTING_IMAGES = 3;
