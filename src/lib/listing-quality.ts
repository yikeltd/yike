import type { Property } from "@/types/database";

export type ListingQualityFlag =
  | "call_for_price"
  | "suspicious_price_low"
  | "suspicious_price_high"
  | "spam_phrase"
  | "missing_contact";

const SPAM_PHRASES = [
  "100% legit",
  "no inspection needed",
  "pay before viewing",
  "urgent urgent",
  "last last price",
  "god bless you hurry",
];

const CITY_PRICE_FLOORS: Record<string, number> = {
  lagos: 200_000,
  abuja: 250_000,
  "port harcourt": 180_000,
};

const CITY_PRICE_CEILINGS: Record<string, number> = {
  aba: 50_000_000,
  enugu: 80_000_000,
};

function textBlob(property: Property): string {
  return `${property.title} ${property.description ?? ""}`.toLowerCase();
}

/** Lightweight moderation signals — flag only, no auto-block. */
export function analyzeListingQuality(property: Property): ListingQualityFlag[] {
  const flags: ListingQualityFlag[] = [];
  const text = textBlob(property);
  const price = Number(property.price);
  const cityKey = property.city.toLowerCase();

  if (
    /call for price|contact for price|price on call|negotiable only/i.test(text)
  ) {
    flags.push("call_for_price");
  }

  for (const phrase of SPAM_PHRASES) {
    if (text.includes(phrase)) {
      flags.push("spam_phrase");
      break;
    }
  }

  const floor = CITY_PRICE_FLOORS[cityKey];
  if (floor && price > 0 && price < floor && property.listing_type === "rent") {
    flags.push("suspicious_price_low");
  }

  const ceiling = CITY_PRICE_CEILINGS[cityKey];
  if (ceiling && price > ceiling) {
    flags.push("suspicious_price_high");
  }

  const agent = property.agent;
  if (agent && !agent.phone && !agent.whatsapp) {
    flags.push("missing_contact");
  }

  return flags;
}

export function qualityFlagLabel(flag: ListingQualityFlag): string {
  switch (flag) {
    case "call_for_price":
      return "Call-for-price wording";
    case "suspicious_price_low":
      return "Unusually low rent";
    case "suspicious_price_high":
      return "Unusually high price";
    case "spam_phrase":
      return "Spam-like phrasing";
    case "missing_contact":
      return "No agent contact";
    default:
      return flag;
  }
}
