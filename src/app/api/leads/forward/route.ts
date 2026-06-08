import { NextResponse } from "next/server";
import {
  buildAgentHandoffUrl,
  buildAgentHandoffMessage,
  listingPublicUrl,
} from "@/lib/leads/whatsapp-urls";
import { getHandoffByReference, markLeadForwarded } from "@/lib/leads/handoff";
import { logLeadEvent } from "@/lib/leads/events";
import { logFunnelEvent } from "@/lib/analytics/whatsapp-funnel-server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const yikeReference = String(body.yikeReference ?? "").trim();
  if (!yikeReference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  const handoff = await getHandoffByReference(yikeReference);
  if (!handoff) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const listingUrl =
    handoff.listingUrl ??
    listingPublicUrl(handoff.listingSlug, handoff.listingId);
  const publicListingCode =
    handoff.publicListingCode ?? yikeReference;

  const redirectUrl =
    handoff.agentHandoffUrl ??
    buildAgentHandoffUrl({
      agentWhatsapp: handoff.agentWhatsapp,
      agentPhone: handoff.agentPhone,
      agentName: handoff.agentName,
      listingTitle: handoff.title,
      publicListingCode,
      listingUrl,
    });

  await markLeadForwarded(yikeReference);
  void logLeadEvent({
    leadId: handoff.leadId,
    type: "user_opened_whatsapp",
    metadata: { channel: "agent_forward" },
  });
  void logLeadEvent({
    leadId: handoff.leadId,
    type: "handoff_shared",
    metadata: { channel: "agent_forward" },
  });
  logFunnelEvent({
    eventType: "handoff_shared",
    listingId: handoff.listingId,
    agentId: handoff.agentId,
    leadId: handoff.leadId,
    metadata: { channel: "agent_forward" },
  });
  logFunnelEvent({
    eventType: "whatsapp_opened",
    listingId: handoff.listingId,
    agentId: handoff.agentId,
    leadId: handoff.leadId,
    metadata: { channel: "agent_forward" },
  });

  const admin = createAdminClient();
  if (admin) {
    const { data: agentRow } = await admin
      .from("profiles")
      .select("successful_handoffs")
      .eq("id", handoff.agentId)
      .maybeSingle();
    if (agentRow) {
      await admin
        .from("profiles")
        .update({
          successful_handoffs: (agentRow.successful_handoffs ?? 0) + 1,
          last_activity_at: new Date().toISOString(),
        })
        .eq("id", handoff.agentId);
    }
    await admin
      .from("leads")
      .update({
        concierge_status: "handoff_shared",
        handoff_shared_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", handoff.leadId);
  }

  return NextResponse.json({
    ok: true,
    redirectUrl,
    prefilledMessage: buildAgentHandoffMessage({
      agentName: handoff.agentName,
      listingTitle: handoff.title,
      publicListingCode,
      listingUrl,
    }),
  });
}
