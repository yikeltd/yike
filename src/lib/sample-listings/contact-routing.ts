/**
 * Sample fixture contact routing — dev/test only when sample fixtures are enabled.
 * Never treats sample numbers as production seller data outside fixture mode.
 */
import { buildTelUrl } from "@/lib/leads/call-routing";
import { generateLeadReference } from "@/lib/leads/reference";
import { handoffPath } from "@/lib/leads/gateway";
import { whatsAppDeepLink } from "@/lib/whatsapp";
import type { MarketplaceAssetType } from "@/lib/marketplace-messaging/service";
import { normalizeAssetType } from "@/lib/marketplace/listings";
import {
  buildListingWhatsAppInquiryMessage,
  type ListingContactContext,
} from "@/lib/marketplace/listing-inquiry-message";
import type { LeadType } from "@/lib/leads/types";
import { getSampleAgentProfile } from "./agent-fixtures";
import { getSampleListingBySlugOrId } from "./query-fixtures";
import { isSampleListingFixtureEnabled, isSampleListingRecord } from "./flags";

export type SampleContactLeadResult = {
  ok: true;
  yikeReference: string;
  redirectUrl: string;
  handoffUrl?: string;
  callAllowed?: boolean;
  routeType: "direct_call" | "whatsapp_fallback";
  sampleFixture: true;
};

export function resolveSampleFixtureContactLead(input: {
  listingId: string;
  agentId: string;
  leadType: LeadType;
  assetType: MarketplaceAssetType;
  contact: ListingContactContext;
}): SampleContactLeadResult | null {
  if (!isSampleListingFixtureEnabled()) return null;
  if (!isSampleListingRecord({ id: input.listingId })) return null;

  const listing = getSampleListingBySlugOrId(input.listingId);
  if (!listing || listing.agent_id !== input.agentId) return null;

  const agent = getSampleAgentProfile(input.agentId);
  const phone = agent?.whatsapp?.trim() || agent?.phone?.trim() || null;
  if (!phone) return null;

  const ref = generateLeadReference(input.contact.city, input.contact.area);
  const asset = normalizeAssetType(listing.asset_type) as MarketplaceAssetType;

  if (input.leadType === "whatsapp") {
    const message = buildListingWhatsAppInquiryMessage(asset, input.contact);
    return {
      ok: true,
      yikeReference: ref,
      redirectUrl: whatsAppDeepLink(phone, message),
      handoffUrl: handoffPath(ref),
      routeType: "whatsapp_fallback",
      sampleFixture: true,
    };
  }

  return {
    ok: true,
    yikeReference: ref,
    redirectUrl: buildTelUrl(phone),
    callAllowed: true,
    routeType: "direct_call",
    sampleFixture: true,
  };
}

export function resolveSampleFixturePhoneReveal(input: {
  listingId: string;
  sellerId: string;
}): { phone: string; telUrl: string } | null {
  if (!isSampleListingFixtureEnabled()) return null;
  if (!isSampleListingRecord({ id: input.listingId })) return null;

  const listing = getSampleListingBySlugOrId(input.listingId);
  if (!listing || listing.agent_id !== input.sellerId) return null;

  const agent = getSampleAgentProfile(input.sellerId);
  const phone = agent?.phone?.trim() || agent?.whatsapp?.trim() || null;
  if (!phone) return null;

  return { phone, telUrl: buildTelUrl(phone) };
}
