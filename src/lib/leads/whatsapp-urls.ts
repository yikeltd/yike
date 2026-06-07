import { SITE_URL, YIKE_SUPPORT_WHATSAPP } from "@/lib/constants";
import { yikeWhatsAppNumber } from "@/lib/leads/gateway";
import { normalizeWhatsApp } from "@/lib/utils";

export function buildYikeInquiryMessage(input: {
  listingTitle: string;
  publicListingCode: string;
  publicAgentCode: string;
  listingUrl: string;
}): string {
  return `Hello Yike, I am interested in this property.

Property: ${input.listingTitle.trim()}
List ID: ${input.publicListingCode}
Agent ID: ${input.publicAgentCode}
Link: ${input.listingUrl}

Please connect me with the agent.`;
}

export function buildYikeWhatsAppInquiryUrl(input: {
  listingTitle: string;
  publicListingCode: string;
  publicAgentCode: string;
  listingUrl: string;
  phone?: string;
}): string {
  const number = normalizeWhatsApp(input.phone ?? yikeWhatsAppNumber() ?? YIKE_SUPPORT_WHATSAPP);
  const text = buildYikeInquiryMessage(input);
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export function buildAgentHandoffMessage(input: {
  agentName: string;
  listingTitle: string;
  publicListingCode: string;
  listingUrl: string;
}): string {
  return `Hello ${input.agentName.trim()},

I saw this property on Yike and I'm interested.

Property:
${input.listingTitle.trim()}

List ID:
${input.publicListingCode}

When can I inspect it?`;
}

export function buildAgentHandoffUrl(input: {
  agentWhatsapp?: string | null;
  agentPhone?: string | null;
  agentName: string;
  listingTitle: string;
  publicListingCode: string;
  listingUrl: string;
}): string {
  const raw = input.agentWhatsapp?.trim() || input.agentPhone?.trim();
  const message = buildAgentHandoffMessage({
    agentName: input.agentName,
    listingTitle: input.listingTitle,
    publicListingCode: input.publicListingCode,
    listingUrl: input.listingUrl,
  });

  if (!raw) {
    return buildYikeWhatsAppInquiryUrl({
      listingTitle: input.listingTitle,
      publicListingCode: input.publicListingCode,
      publicAgentCode: "support",
      listingUrl: input.listingUrl,
    });
  }

  const number = normalizeWhatsApp(raw);
  if (!number || number.length < 10) {
    return buildYikeWhatsAppInquiryUrl({
      listingTitle: input.listingTitle,
      publicListingCode: input.publicListingCode,
      publicAgentCode: "support",
      listingUrl: input.listingUrl,
    });
  }

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function buildSupportHandoffReply(input: {
  agentName: string;
  agentHandoffUrl: string;
}): string {
  return `Hi 👋

Thanks for contacting Yike.

We've connected you with the property agent for this listing.

Agent: ${input.agentName}

Tap below to message the agent directly:
${input.agentHandoffUrl}

Suggested message:
"Hello, I saw this property on Yike and I'm interested. When can I inspect it?"

Thank you for using Yike.`;
}

/** Public listing URL — never expose raw listing UUIDs. */
export function listingPublicUrl(
  slug: string | null | undefined,
  _listingId?: string
): string {
  if (slug?.trim()) {
    return `${SITE_URL}/properties/${slug.trim()}`;
  }
  return `${SITE_URL}/search`;
}

/** Resolve listing URL from browser path when slug is in the address bar. */
export function listingUrlFromSourcePage(sourcePage: string): string {
  const path = sourcePage.split("?")[0]?.trim() ?? "";
  if (path.startsWith("/properties/") && path.length > "/properties/".length) {
    const origin =
      typeof window !== "undefined" ? window.location.origin : SITE_URL;
    return `${origin}${path}`;
  }
  return `${SITE_URL}/search`;
}
