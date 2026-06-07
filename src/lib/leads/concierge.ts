import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildAgentHandoffUrl,
  buildSupportHandoffReply,
  buildYikeWhatsAppInquiryUrl,
  listingPublicUrl,
} from "@/lib/leads/whatsapp-urls";
import { generateLeadCode, ensurePublicAgentCode, ensurePublicListingCode } from "@/lib/public-codes";
import type { ConciergeLeadSnapshot } from "@/lib/leads/concierge-types";

export type ConciergeEnrichInput = {
  leadId: string;
  listingId: string;
  agentId: string;
  listingTitle: string;
  listingSlug?: string | null;
  agentName: string;
  agentWhatsapp?: string | null;
  agentPhone?: string | null;
  sourceSurface?: string | null;
  sourcePage?: string | null;
  sourceCampaign?: string | null;
  guestId?: string | null;
  userId?: string | null;
};

export async function enrichConciergeLead(
  admin: SupabaseClient,
  input: ConciergeEnrichInput
): Promise<ConciergeLeadSnapshot | null> {
  const [publicListingCode, publicAgentCode] = await Promise.all([
    ensurePublicListingCode(admin, input.listingId),
    ensurePublicAgentCode(admin, input.agentId),
  ]);

  if (!publicListingCode || !publicAgentCode) return null;

  const listingUrl = listingPublicUrl(input.listingSlug, input.listingId);
  const handoffUrl = buildAgentHandoffUrl({
    agentWhatsapp: input.agentWhatsapp,
    agentPhone: input.agentPhone,
    agentName: input.agentName,
    listingTitle: input.listingTitle,
    publicListingCode,
    listingUrl,
  });

  const supportReply = buildSupportHandoffReply({
    agentName: input.agentName,
    agentHandoffUrl: handoffUrl,
  });

  let leadCode = generateLeadCode();
  for (let i = 0; i < 5; i++) {
    const { error } = await admin
      .from("leads")
      .update({
        lead_code: leadCode,
        public_listing_code: publicListingCode,
        listing_slug: input.listingSlug ?? null,
        listing_url: listingUrl,
        listing_title: input.listingTitle,
        public_agent_code: publicAgentCode,
        agent_name: input.agentName,
        agent_whatsapp: input.agentWhatsapp ?? input.agentPhone ?? null,
        channel: "whatsapp",
        concierge_status: "handoff_prepared",
        handoff_url: handoffUrl,
        handoff_message: supportReply,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.leadId)
      .is("lead_code", null);

    if (!error) break;

    const { data: existing } = await admin
      .from("leads")
      .select("lead_code")
      .eq("id", input.leadId)
      .maybeSingle();
    if (existing?.lead_code) {
      leadCode = existing.lead_code as string;
      break;
    }
    leadCode = generateLeadCode();
  }

  await admin
    .from("leads")
    .update({
      public_listing_code: publicListingCode,
      listing_slug: input.listingSlug ?? null,
      listing_url: listingUrl,
      listing_title: input.listingTitle,
      public_agent_code: publicAgentCode,
      agent_name: input.agentName,
      agent_whatsapp: input.agentWhatsapp ?? input.agentPhone ?? null,
      channel: "whatsapp",
      concierge_status: "handoff_prepared",
      handoff_url: handoffUrl,
      handoff_message: supportReply,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.leadId);

  return {
    leadCode,
    publicListingCode,
    publicAgentCode,
    listingSlug: input.listingSlug ?? null,
    listingUrl,
    listingTitle: input.listingTitle,
    agentName: input.agentName,
    agentWhatsapp: input.agentWhatsapp ?? input.agentPhone ?? null,
    handoffUrl,
    handoffMessage: supportReply,
    supportReply,
  };
}

export function buildConciergeWhatsAppRedirect(snapshot: {
  listingTitle: string;
  publicListingCode: string;
  publicAgentCode: string;
  listingUrl: string;
}): string {
  return buildYikeWhatsAppInquiryUrl(snapshot);
}

export function snapshotFromLeadRow(lead: {
  lead_code?: string | null;
  public_listing_code?: string | null;
  public_agent_code?: string | null;
  listing_slug?: string | null;
  listing_url?: string | null;
  listing_title?: string | null;
  listing_id: string;
  agent_name?: string | null;
  agent_whatsapp?: string | null;
  handoff_url?: string | null;
  handoff_message?: string | null;
  agent?: { full_name?: string | null; whatsapp?: string | null; phone?: string | null } | null;
  listing?: { title?: string; slug?: string | null } | null;
}): ConciergeLeadSnapshot | null {
  const publicListingCode = lead.public_listing_code;
  const publicAgentCode = lead.public_agent_code;
  const listingTitle =
    lead.listing_title ?? lead.listing?.title ?? "Property";
  const listingSlug = lead.listing_slug ?? lead.listing?.slug ?? null;
  const listingUrl =
    lead.listing_url ?? listingPublicUrl(listingSlug, lead.listing_id);
  const agentName =
    lead.agent_name ?? lead.agent?.full_name ?? "Agent";
  const agentWhatsapp =
    lead.agent_whatsapp ?? lead.agent?.whatsapp ?? lead.agent?.phone ?? null;

  if (!publicListingCode || !publicAgentCode) return null;

  const handoffUrl =
    lead.handoff_url ??
    buildAgentHandoffUrl({
      agentWhatsapp: agentWhatsapp,
      agentName,
      listingTitle,
      publicListingCode,
      listingUrl,
    });

  const supportReply =
    lead.handoff_message ??
    buildSupportHandoffReply({ agentName, agentHandoffUrl: handoffUrl });

  return {
    leadCode: lead.lead_code ?? "",
    publicListingCode,
    publicAgentCode,
    listingSlug,
    listingUrl,
    listingTitle,
    agentName,
    agentWhatsapp,
    handoffUrl,
    handoffMessage: supportReply,
    supportReply,
  };
}
