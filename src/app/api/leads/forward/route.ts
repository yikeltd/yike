import { NextResponse } from "next/server";
import { buildAgentHandoffMessage } from "@/lib/leads/message";
import { getHandoffByReference, markLeadForwarded } from "@/lib/leads/handoff";
import { whatsAppDeepLink } from "@/lib/whatsapp";

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

  const wa = handoff.agentWhatsapp || handoff.agentPhone;
  if (!wa) {
    return NextResponse.json({ error: "No agent WhatsApp" }, { status: 400 });
  }

  await markLeadForwarded(yikeReference);

  const message = buildAgentHandoffMessage({
    agentName: handoff.agentName,
    price: handoff.price,
    paymentPeriod: handoff.paymentPeriod,
    listingType: handoff.listingType,
    propertyTitle: handoff.title,
    area: handoff.area,
    city: handoff.city,
    bedrooms: handoff.bedrooms ?? undefined,
    propertyType: handoff.propertyType,
    yikeReference,
  });

  return NextResponse.json({
    ok: true,
    redirectUrl: whatsAppDeepLink(wa, message),
  });
}
