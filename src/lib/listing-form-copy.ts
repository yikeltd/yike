import type { ListingTypeValue } from "@/constants/listingTypes";
import { LISTING_TYPE_CONFIG } from "@/constants/listingTypes";
import { getPropertyCategoryLabel } from "@/constants/propertyCategories";
import type { ValueDriverCategory } from "@/constants/valueDrivers";
import { PAYMENT_PERIODS } from "@/lib/constants";
import {
  isCommercialProperty,
  isLandProperty,
} from "@/lib/listing-field-rules";
import { suggestListingTitle } from "@/lib/title-normalize";

type PaymentPeriodValue = (typeof PAYMENT_PERIODS)[number]["value"];

const PAYMENT_PERIODS_BY_LISTING_TYPE: Record<ListingTypeValue, PaymentPeriodValue[]> = {
  rent: ["yearly", "monthly"],
  lease: ["yearly", "monthly"],
  sale: ["total"],
  shortlet: ["daily", "weekly", "monthly"],
};

export function paymentPeriodsForListingType(listingType: ListingTypeValue) {
  const allowed = new Set(PAYMENT_PERIODS_BY_LISTING_TYPE[listingType]);
  return PAYMENT_PERIODS.filter((p) => allowed.has(p.value));
}

export function listingStepTitle(
  step: number,
  listingType: ListingTypeValue,
  propertyType: string
): string {
  if (step === 1) return "Listing type";
  if (step === 3) return "Location";
  if (step === 4) return "Photos & submit";

  if (isLandProperty(propertyType)) {
    return listingType === "lease" ? "Plot & lease terms" : "Plot details";
  }
  if (isCommercialProperty(propertyType)) {
    return "Shop / office details";
  }
  if (listingType === "shortlet") {
    return "Stay details";
  }
  if (listingType === "sale") {
    return "Property for sale";
  }
  return "Property details";
}

export function listingStepSubheading(
  listingType: ListingTypeValue,
  propertyType: string
): string {
  if (isLandProperty(propertyType)) {
    return listingType === "lease"
      ? "Share plot size, lease terms, and price."
      : "Share plot size, title status, and sale price.";
  }
  if (isCommercialProperty(propertyType)) {
    const label = getPropertyCategoryLabel(propertyType).toLowerCase();
    return `Describe the ${label}, rent or price, and shop features buyers care about.`;
  }
  if (listingType === "shortlet") {
    return LISTING_TYPE_CONFIG.shortlet.description;
  }
  return LISTING_TYPE_CONFIG[listingType]?.description ?? "Add the basics buyers search for.";
}

export function titlePlaceholder(
  listingType: ListingTypeValue,
  propertyType: string
): string {
  if (isLandProperty(propertyType)) {
    return listingType === "lease"
      ? "e.g. 2 plots for lease in Osisioma"
      : "e.g. Residential land in World Bank Estate";
  }
  if (isCommercialProperty(propertyType)) {
    if (propertyType === "shop" || propertyType === "plaza") {
      return "e.g. Shop space on Aba Road";
    }
    if (propertyType === "warehouse") {
      return "e.g. Warehouse with parking in Port Harcourt";
    }
    return "e.g. Office space in Wuse 2";
  }
  if (listingType === "shortlet") {
    return "e.g. Furnished 2-bed shortlet in Lekki";
  }
  if (listingType === "sale") {
    return "e.g. 3-bedroom bungalow in GRA";
  }
  return "e.g. 2-bed flat in Ogbor Hill";
}

export function titleFieldHint(
  listingType: ListingTypeValue,
  propertyType: string
): string | null {
  if (isLandProperty(propertyType)) {
    return "Mention plot size, access road, or estate name if you can.";
  }
  if (isCommercialProperty(propertyType)) {
    return "Mention road frontage, floor size, or a nearby landmark.";
  }
  if (listingType === "shortlet") {
    return "Mention furnished setup, nightly rate area, or estate name.";
  }
  return null;
}

export function buildSuggestedTitle(input: {
  listingType: ListingTypeValue;
  propertyType: string;
  bedrooms?: string | number;
  area?: string;
  city?: string;
}): string | null {
  const place = input.area?.trim() || input.city?.trim();
  const category = getPropertyCategoryLabel(input.propertyType);
  const beds =
    typeof input.bedrooms === "string"
      ? Number(input.bedrooms) || 0
      : input.bedrooms ?? 0;

  if (isLandProperty(input.propertyType)) {
    if (!place) return null;
    return `${category} in ${place}`;
  }

  if (isCommercialProperty(input.propertyType)) {
    if (!place) return null;
    if (input.listingType === "sale") {
      return `${category} for sale in ${place}`;
    }
    return `${category} in ${place}`;
  }

  if (input.listingType === "shortlet") {
    if (!place) return null;
    return beds > 0
      ? `Furnished ${beds}-bed ${category.toLowerCase()} in ${place}`
      : `Furnished ${category.toLowerCase()} in ${place}`;
  }

  return suggestListingTitle({
    property_type: input.propertyType,
    bedrooms: beds > 0 ? beds : undefined,
    area: input.area,
    city: input.city,
  });
}

export function priceFieldCopy(
  listingType: ListingTypeValue,
  paymentPeriod: string
): { label: string; placeholder: string } {
  if (listingType === "sale") {
    return {
      label: "Sale price (₦)",
      placeholder: "e.g. 25,000,000 or 25m",
    };
  }
  if (listingType === "shortlet") {
    if (paymentPeriod === "weekly") {
      return { label: "Weekly rate (₦)", placeholder: "e.g. 180,000" };
    }
    if (paymentPeriod === "monthly") {
      return { label: "Monthly rate (₦)", placeholder: "e.g. 650,000" };
    }
    return { label: "Nightly rate (₦)", placeholder: "e.g. 35,000" };
  }
  if (paymentPeriod === "monthly") {
    return { label: "Rent per month (₦)", placeholder: "e.g. 450,000" };
  }
  if (listingType === "lease") {
    return { label: "Lease amount (₦ per year)", placeholder: "e.g. 2,500,000" };
  }
  return { label: "Rent per year (₦)", placeholder: "e.g. 1,500,000 or 1.5m" };
}

export function paymentPeriodLabel(listingType: ListingTypeValue): string {
  if (listingType === "sale") return "Price type";
  if (listingType === "shortlet") return "Rate period";
  if (listingType === "lease") return "Lease period";
  return "Rent period";
}

export function amenitiesSectionLabel(
  listingType: ListingTypeValue,
  propertyType: string
): string {
  if (isCommercialProperty(propertyType)) return "Shop features (optional)";
  if (isLandProperty(propertyType)) return "Plot features (optional)";
  if (listingType === "shortlet") return "Stay amenities (optional)";
  return "Amenities (optional)";
}

export function valueDriversSectionTitle(
  listingType: ListingTypeValue,
  propertyType: string
): string {
  if (isLandProperty(propertyType)) return "Why this plot stands out (optional)";
  if (isCommercialProperty(propertyType)) return "Why this space stands out (optional)";
  if (listingType === "shortlet") return "Why guests choose this stay (optional)";
  return "Why this property stands out (optional)";
}

export function valueDriverCategoriesFor(
  listingType: ListingTypeValue,
  propertyType: string
): ValueDriverCategory[] {
  if (isLandProperty(propertyType)) {
    return ["location", "land_documents", "condition"];
  }
  if (isCommercialProperty(propertyType)) {
    return ["location", "commercial", "condition"];
  }
  if (listingType === "shortlet") {
    return ["location", "condition", "lifestyle"];
  }
  return ["location", "condition", "lifestyle"];
}

export function descriptionPlaceholder(
  listingType: ListingTypeValue,
  propertyType: string
): string {
  if (isLandProperty(propertyType)) {
    return "Plot size, road access, title papers, or nearby landmarks (optional)";
  }
  if (isCommercialProperty(propertyType)) {
    return "Floor size, road frontage, power, parking, or nearby market (optional)";
  }
  if (listingType === "shortlet") {
    return "Furnishing, WiFi, power, cleaning, and what guests get (optional)";
  }
  if (listingType === "sale") {
    return "Rooms, finishing, documents, and nearby landmarks (optional)";
  }
  return "Rooms, finishing, and nearby landmarks (optional)";
}

export function descriptionTip(
  listingType: ListingTypeValue,
  propertyType: string
): string {
  if (isLandProperty(propertyType)) {
    return "Tip: Mention plot size, road type, documents, and nearby landmarks to attract serious buyers.";
  }
  if (isCommercialProperty(propertyType)) {
    return "Tip: Mention frontage, foot traffic, parking, toilet, and power to help tenants decide faster.";
  }
  if (listingType === "shortlet") {
    return "Tip: Mention furnishing, WiFi, power backup, and check-in details guests ask about first.";
  }
  if (listingType === "sale") {
    return "Tip: Mention rooms, title status, finishing, and nearby landmarks to build trust.";
  }
  return "Tip: Mention rooms, location, price details, and nearby landmarks to get better responses.";
}

export function locationCopy(
  listingType: ListingTypeValue,
  propertyType: string
): {
  searchPlaceholder: string;
  landmarkPlaceholder: string;
  addressHintPlaceholder: string;
  hint: string | null;
} {
  if (isLandProperty(propertyType)) {
    return {
      searchPlaceholder: "City, area, or estate where the plot is",
      landmarkPlaceholder: "e.g. Near estate gate or main road junction",
      addressHintPlaceholder: "Plot number or survey details (private)",
      hint: "Pick the nearest city or estate so buyers can find the plot.",
    };
  }
  if (isCommercialProperty(propertyType)) {
    return {
      searchPlaceholder: "Market, plaza, road, or business district",
      landmarkPlaceholder: "e.g. Opposite First Bank or inside plaza",
      addressHintPlaceholder: "Shop/unit number (private)",
      hint: "Commercial buyers search by road, market, and plaza name.",
    };
  }
  if (listingType === "shortlet") {
    return {
      searchPlaceholder: "City, estate, or area guests know",
      landmarkPlaceholder: "e.g. Near mall or main estate gate",
      addressHintPlaceholder: "Check-in directions (private)",
      hint: "Guests often search by estate name and popular areas.",
    };
  }
  return {
    searchPlaceholder: "City, area, estate, or LGA",
    landmarkPlaceholder: "Nearest landmark",
    addressHintPlaceholder: "House number or gate details (private)",
    hint: null,
  };
}

export function photoManagerCopy(
  listingType: ListingTypeValue,
  propertyType: string
): {
  uploadHint: string;
  labelPlaceholder: string;
  sortStoryLabel: string;
} {
  if (isLandProperty(propertyType)) {
    return {
      uploadHint: "Start with land view, street access, and gate shots",
      labelPlaceholder: "Photo label…",
      sortStoryLabel: "Sort photos",
    };
  }
  if (isCommercialProperty(propertyType)) {
    return {
      uploadHint: "Start with shop front, street view, and interior",
      labelPlaceholder: "Photo label…",
      sortStoryLabel: "Sort photos",
    };
  }
  if (listingType === "shortlet") {
    return {
      uploadHint: "Show exterior, living area, bedroom, and bathroom",
      labelPlaceholder: "Room label…",
      sortStoryLabel: "Sort story",
    };
  }
  return {
    uploadHint: "Tap to pick or drag photos here",
    labelPlaceholder: "Room label…",
    sortStoryLabel: "Sort story",
  };
}

export function validateTitleMessage(
  listingType: ListingTypeValue,
  propertyType: string
): string {
  if (isLandProperty(propertyType)) {
    return "Add a short title with plot size or location.";
  }
  if (isCommercialProperty(propertyType)) {
    return "Add a short title for the shop or office.";
  }
  return "Add a short title for your listing.";
}

export function validatePriceMessage(
  listingType: ListingTypeValue,
  paymentPeriod: string
): string {
  if (listingType === "sale") return "Enter a sale price in ₦.";
  if (listingType === "shortlet") {
    if (paymentPeriod === "weekly") return "Enter a weekly rate in ₦.";
    if (paymentPeriod === "monthly") return "Enter a monthly rate in ₦.";
    return "Enter a nightly rate in ₦.";
  }
  if (listingType === "lease") return "Enter a lease amount in ₦.";
  return "Enter a rent amount in ₦.";
}
