import { buildAgentHandoffMessage as buildAgentHandoffMessageFromUrls } from "@/lib/leads/whatsapp-urls";
import { formatPrice, propertyTypeLabel } from "@/lib/utils";
import type { PaymentPeriod, ListingType } from "@/types/database";

function propertyDescriptor(input: {
  propertyTitle: string;
  bedrooms?: number;
  propertyType?: string | null;
}): string {
  const { propertyTitle, bedrooms, propertyType } = input;
  let descriptor = propertyTitle.trim();
  if (bedrooms && bedrooms > 0) {
    const typeLabel = propertyType
      ? propertyTypeLabel(propertyType).toLowerCase()
      : "property";
    descriptor = `${bedrooms} Bedroom ${typeLabel}`;
  } else if (propertyType) {
    descriptor = propertyTypeLabel(propertyType);
  }
  return descriptor;
}

/** User's first message to Yike WhatsApp (human-assisted concierge). */
export function buildGatewayInquiryMessage(input: {
  propertyTitle: string;
  publicListingCode: string;
  publicAgentCode: string;
  listingUrl: string;
  /** @deprecated internal only — do not put in public message */
  yikeReference?: string;
  listingId?: string;
  agentId?: string;
  price?: number;
  paymentPeriod?: PaymentPeriod;
  listingType?: ListingType;
  area?: string;
  city?: string;
  bedrooms?: number;
  propertyType?: string | null;
}): string {
  const lines = [
    "Hello Yike, I am interested in this property.",
    "",
    `Property: ${input.propertyTitle.trim()}`,
    `List ID: ${input.publicListingCode}`,
    `Agent ID: ${input.publicAgentCode}`,
    `Link: ${input.listingUrl}`,
    "",
    "Please connect me with the agent.",
  ];

  return lines.join("\n");
}

/** Direct-to-agent WhatsApp message (logged lead required first). */
export function buildDirectAgentInquiryMessage(input: {
  agentName: string;
  propertyTitle: string;
  publicListingCode: string;
  listingUrl: string;
  yikeReference?: string;
}): string {
  return buildAgentHandoffMessageFromUrls({
    agentName: input.agentName,
    listingTitle: input.propertyTitle,
    publicListingCode: input.publicListingCode,
    listingUrl: input.listingUrl,
  });
}

/** Prefilled message when user messages agent directly (public codes only). */
export function buildAgentHandoffMessage(input: {
  agentName: string;
  propertyTitle: string;
  publicListingCode: string;
  listingUrl: string;
  price?: number;
  paymentPeriod?: PaymentPeriod;
  listingType?: ListingType;
  area?: string;
  city?: string;
  bedrooms?: number;
  propertyType?: string | null;
  yikeReference?: string;
}): string {
  return buildAgentHandoffMessageFromUrls({
    agentName: input.agentName,
    listingTitle: input.propertyTitle,
    publicListingCode: input.publicListingCode,
    listingUrl: input.listingUrl,
  });
}

/** @deprecated legacy callers — prefer buildAgentHandoffMessage with public codes */
export function buildLeadWhatsAppMessage(input: {
  agentName: string;
  price: number;
  paymentPeriod: PaymentPeriod;
  listingType: ListingType;
  propertyTitle: string;
  area: string;
  city: string;
  bedrooms?: number;
  propertyType?: string | null;
  yikeReference: string;
}): string {
  const priceLabel = formatPrice(input.price, input.paymentPeriod, input.listingType);
  const location = input.area ? `${input.area}, ${input.city}` : input.city;
  const descriptor = propertyDescriptor(input);
  return `Hi ${input.agentName}, I saw your ${descriptor} in ${location} on Yike.ng (${priceLabel}).

Reference:
${input.yikeReference}

Is it still available?`;
}

/** Copy shown on /l/[ref] handoff page (mirrors future auto-reply). */
export function buildHandoffSummary(input: {
  price: number;
  paymentPeriod: PaymentPeriod;
  listingType: ListingType;
  propertyTitle: string;
  area: string;
  city: string;
  bedrooms?: number;
  propertyType?: string | null;
  yikeReference: string;
}): {
  title: string;
  location: string;
  priceLabel: string;
  reference: string;
} {
  return {
    title: propertyDescriptor(input),
    location: input.area ? `${input.area}, ${input.city}` : input.city,
    priceLabel: formatPrice(input.price, input.paymentPeriod, input.listingType),
    reference: input.yikeReference,
  };
}

/** SEO / location pages — general help message to Yike. */
export function buildLocationHelpMessage(city: string, area?: string): string {
  const place = area ? `${area}, ${city}` : city;
  return `Hi Yike, I need help finding a house in ${place}. Can you connect me with a verified agent?`;
}
