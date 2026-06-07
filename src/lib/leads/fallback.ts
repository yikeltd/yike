import { handoffPath, yikeWhatsAppNumber } from "@/lib/leads/gateway";
import { buildGatewayInquiryMessage } from "@/lib/leads/message";
import { listingPublicUrl } from "@/lib/leads/whatsapp-urls";
import { whatsAppDeepLink } from "@/lib/whatsapp";

export type SupportFallbackInput = {
  yikeReference: string;
  listingId: string;
  agentId: string;
  title: string;
  area?: string;
  city?: string;
  slug?: string | null;
  publicListingCode?: string;
  publicAgentCode?: string;
  price?: number;
  paymentPeriod?: string;
  listingType?: string;
  bedrooms?: number;
  propertyType?: string | null;
};

/** Always opens Yike support — used when routing pipeline fails. */
export function buildSupportFallbackResult(input: SupportFallbackInput) {
  const listingUrl = listingPublicUrl(input.slug, input.listingId);

  const message = buildGatewayInquiryMessage({
    propertyTitle: input.title || "Property inquiry",
    publicListingCode: input.publicListingCode ?? input.yikeReference,
    publicAgentCode: input.publicAgentCode ?? "support",
    listingUrl,
  });

  return {
    ok: true as const,
    yikeReference: input.yikeReference,
    redirectUrl: whatsAppDeepLink(yikeWhatsAppNumber(), message),
    handoffUrl: handoffPath(input.yikeReference),
    gateway: true,
    fallback: true,
  };
}
