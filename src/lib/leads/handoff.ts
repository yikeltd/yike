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
       listing:properties!leads_listing_id_fkey (
         title, area, city, price, payment_period, listing_type, bedrooms, property_type
       ),
       agent:profiles!leads_agent_id_fkey (
         full_name, whatsapp, phone
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
  } | null;
  const agent = (Array.isArray(agentRaw) ? agentRaw[0] : agentRaw) as {
    full_name: string | null;
    whatsapp: string | null;
    phone: string | null;
  } | null;

  if (!listing || !agent) return null;

  return {
    yikeReference: data.yike_reference,
    leadId: data.id,
    listingId: data.listing_id,
    agentId: data.agent_id,
    agentName: agent.full_name ?? "Agent",
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
