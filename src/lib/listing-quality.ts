import type { Property, PropertyMediaItem } from "@/types/database";
import { isVerifiedAgentProfile } from "@/lib/agent-tiers";
import { normalizePropertyMedia } from "@/lib/media/items";
import { PREFERRED_COVER_LABELS } from "@/lib/media/labels";

export type ListingQualityFlag =
  | "call_for_price"
  | "suspicious_price_low"
  | "suspicious_price_high"
  | "spam_phrase"
  | "profanity"
  | "thin_description"
  | "few_images"
  | "missing_contact";

/** Block submit when any of these flags are present. */
export const BLOCKING_QUALITY_FLAGS: ListingQualityFlag[] = [
  "call_for_price",
  "spam_phrase",
  "profanity",
];

const PROFANITY_TERMS = [
  "fuck",
  "shit",
  "bitch",
  "bastard",
  "nigger",
  "whore",
];

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

function textBlob(title: string, description?: string | null): string {
  return `${title} ${description ?? ""}`.toLowerCase();
}

function analyzeListingSignals(input: {
  title: string;
  description?: string | null;
  price: number;
  city: string;
  listing_type: string;
  media_urls: string[];
  agent?: Property["agent"];
}): ListingQualityFlag[] {
  const flags: ListingQualityFlag[] = [];
  const text = textBlob(input.title, input.description);
  const price = Number(input.price);
  const cityKey = input.city.toLowerCase();

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

  for (const term of PROFANITY_TERMS) {
    if (text.includes(term)) {
      flags.push("profanity");
      break;
    }
  }

  const desc = (input.description ?? "").trim();
  if (desc.length > 0 && desc.length < 15) {
    flags.push("thin_description");
  }

  if (input.media_urls.length < 2) {
    flags.push("few_images");
  }

  const floor = CITY_PRICE_FLOORS[cityKey];
  if (floor && price > 0 && price < floor && input.listing_type === "rent") {
    flags.push("suspicious_price_low");
  }

  const ceiling = CITY_PRICE_CEILINGS[cityKey];
  if (ceiling && price > ceiling) {
    flags.push("suspicious_price_high");
  }

  const agent = input.agent;
  if (agent && !agent.phone && !agent.whatsapp) {
    flags.push("missing_contact");
  }

  return flags;
}

/** Lightweight moderation signals — flag only, no auto-block. */
export function analyzeListingQuality(property: Property): ListingQualityFlag[] {
  return analyzeListingSignals({
    title: property.title,
    description: property.description,
    price: Number(property.price),
    city: property.city,
    listing_type: property.listing_type,
    media_urls: property.media_urls,
    agent: property.agent,
  });
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
    case "profanity":
      return "Inappropriate language";
    case "thin_description":
      return "Description too short";
    case "few_images":
      return "Too few photos";
    case "missing_contact":
      return "No agent contact";
    default:
      return flag;
  }
}

function photoQualityBonus(items: PropertyMediaItem[]): number {
  if (items.length === 0) return 0;
  let bonus = 0;
  bonus += Math.min(items.length, 8) * 4;
  const labeled = items.filter((i) => i.room_label && i.room_label !== "Other");
  bonus += Math.min(labeled.length, 6) * 2;
  const sharp = items.filter(
    (i) => !i.width || Math.max(i.width, i.height ?? 0) >= 480
  );
  bonus += Math.min(sharp.length, 6) * 2;
  if (items.some((i) => PREFERRED_COVER_LABELS.has(i.room_label ?? ""))) {
    bonus += 6;
  }
  return bonus;
}

/** Internal 0–100 score for feed ranking — not shown to users. */
export function computeListingQualityScore(property: Property): number {
  let score = 0;

  const mediaItems = normalizePropertyMedia(property);
  score += photoQualityBonus(mediaItems);
  score += Math.min(property.media_urls.length, 8) * 4;
  const descLen = (property.description ?? "").trim().length;
  if (descLen >= 120) score += 24;
  else if (descLen >= 60) score += 14;
  else if (descLen >= 20) score += 6;

  if (property.is_verified_listing) score += 20;
  if (property.agent && isVerifiedAgentProfile(property.agent)) score += 16;

  const ageDays =
    (Date.now() - new Date(property.created_at).getTime()) / 86_400_000;
  score += Math.max(0, 14 - ageDays) * 2;

  score += Math.min(property.contact_clicks ?? 0, 25);

  const flags = analyzeListingQuality(property);
  score -= flags.length * 10;

  return Math.max(0, Math.min(100, score));
}

export type ListingDraft = Pick<
  Property,
  "title" | "description" | "price" | "city" | "listing_type" | "media_urls"
> & { agent?: Property["agent"] };

/** Pre-submit moderation — returns flags for agent form. */
export function moderateListingDraft(draft: ListingDraft): ListingQualityFlag[] {
  return analyzeListingSignals(draft);
}
