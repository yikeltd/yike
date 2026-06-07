import { createAdminClient } from "@/lib/supabase/admin";
import type { ListingType, PaymentPeriod } from "@/types/database";

export type HandoffPayload = {
  yikeReference: string;
  leadId: string;
  listingId: string;
  agentId: string;
  agentName: string;
  agentWhatsapp: string | null;
  agentPhone: string | null;
  title: string;
  area: string;
  city: string;
  price: number;
  paymentPeriod: PaymentPeriod;
  listingType: ListingType;
  bedrooms: number | null;
  propertyType: string | null;
  status: string;
  leadCode?: string | null;
  publicListingCode?: string | null;
  publicAgentCode?: string | null;
  listingSlug?: string | null;
  listingUrl?: string | null;
  agentHandoffUrl?: string | null;
  supportReply?: string | null;
  conciergeStatus?: string | null;
};

export async function getHandoffByReference(
  ref: string
): Promise<HandoffPayload | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data } = await admin
    .from("leads")
    .select(
      `id, yike_reference, status, listing_id, agent_id,
       lead_code, public_listing_code, public_agent_code, listing_slug, listing_url,
       listing_title, agent_name, agent_whatsapp, handoff_url, handoff_message,
       concierge_status, source_surface, source_page,
       listing:properties!leads_listing_id_fkey (
         title, area, city, price, payment_period, listing_type, bedrooms, property_type, slug, public_listing_code
       ),
       agent:profiles!leads_agent_id_fkey (
         full_name, whatsapp, phone, public_agent_code, public_slug
       )`
    )
    .eq("yike_reference", ref)
    .maybeSingle();

  if (!data) return null;

  const listingRaw = data.listing;
  const agentRaw = data.agent;
  const listing = (Array.isArray(listingRaw) ? listingRaw[0] : listingRaw) as {
    title: string;
    area: string;
    city: string;
    price: number;
    payment_period: PaymentPeriod;
    listing_type: ListingType;
    bedrooms: number | null;
    property_type: string | null;
    slug?: string | null;
    public_listing_code?: string | null;
  } | null;
  const agent = (Array.isArray(agentRaw) ? agentRaw[0] : agentRaw) as {
    full_name: string | null;
    whatsapp: string | null;
    phone: string | null;
    public_agent_code?: string | null;
  } | null;

  if (!listing || !agent) return null;

  return {
    yikeReference: data.yike_reference,
    leadId: data.id,
    listingId: data.listing_id,
    agentId: data.agent_id,
    agentName: agent.full_name ?? data.agent_name ?? "Agent",
    agentWhatsapp: agent.whatsapp,
    agentPhone: agent.phone,
    title: listing.title,
    area: listing.area,
    city: listing.city,
    price: Number(listing.price),
    paymentPeriod: listing.payment_period,
    listingType: listing.listing_type,
    bedrooms: listing.bedrooms,
    propertyType: listing.property_type,
    status: data.status,
    leadCode: data.lead_code,
    publicListingCode:
      data.public_listing_code ??
      (listing as { public_listing_code?: string }).public_listing_code ??
      null,
    publicAgentCode:
      data.public_agent_code ?? agent.public_agent_code ?? null,
    listingSlug: data.listing_slug ?? listing.slug ?? null,
    listingUrl: data.listing_url ?? null,
    agentHandoffUrl: data.handoff_url ?? null,
    supportReply: data.handoff_message ?? null,
    conciergeStatus: data.concierge_status ?? null,
  };
}

export async function markLeadForwarded(ref: string): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return false;

  const { error } = await admin
    .from("leads")
    .update({ status: "connected" })
    .eq("yike_reference", ref)
    .neq("status", "converted");

  return !error;
}
