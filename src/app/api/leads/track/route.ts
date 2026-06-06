import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  buildAgentHandoffMessage,
  buildGatewayInquiryMessage,
} from "@/lib/leads/message";
import {
  handoffPath,
  resolveLeadGatewayMode,
  yikeWhatsAppNumber,
} from "@/lib/leads/gateway";
import { hashClientIp, logLead } from "@/lib/leads/log";
import { generateLeadReference } from "@/lib/leads/reference";
import type { LeadType } from "@/lib/leads/types";
import { whatsAppDeepLink } from "@/lib/whatsapp";
import { formatPhoneForTel } from "@/lib/utils";
import type { ListingType, PaymentPeriod } from "@/types/database";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  const listingId = String(body.listingId ?? "");
  const agentId = String(body.agentId ?? "");
  const leadType = body.leadType as LeadType;
  const sourcePage = String(body.sourcePage ?? "");
  const guestId = String(body.guestId ?? "") || null;

  if (!listingId || !agentId || (leadType !== "whatsapp" && leadType !== "call")) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const agentName = String(body.agentName ?? "there");
  const title = String(body.title ?? "");
  const area = String(body.area ?? "");
  const city = String(body.city ?? "");
  const price = Number(body.price ?? 0);
  const paymentPeriod = (body.paymentPeriod ?? "yearly") as PaymentPeriod;
  const listingType = (body.listingType ?? "rent") as ListingType;
  const bedrooms = Number(body.bedrooms ?? 0) || undefined;
  const propertyType = body.propertyType ? String(body.propertyType) : null;
  const whatsapp = body.whatsapp ? String(body.whatsapp) : null;
  const phone = body.phone ? String(body.phone) : null;

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip");
  const userAgent = request.headers.get("user-agent");

  let userId: string | null = null;
  const supabase = await createClient();
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  }

  const logResult = await logLead({
    userId,
    guestId,
    userIpHash: hashClientIp(ip),
    listingId,
    agentId,
    leadType,
    sourcePage,
    userAgent,
    city,
    area,
  });

  const yikeReference = logResult.ok
    ? logResult.yikeReference
    : generateLeadReference(city, area);

  if (!logResult.ok) {
    console.warn("[leads/track] logging skipped:", logResult.error);
  }

  if (leadType === "whatsapp") {
    const wa = whatsapp || phone;
    if (!wa) {
      return NextResponse.json({ error: "No WhatsApp number" }, { status: 400 });
    }

    const messageInput = {
      agentName,
      price,
      paymentPeriod,
      listingType,
      propertyTitle: title,
      area,
      city,
      bedrooms,
      propertyType,
      yikeReference,
    };

    if (resolveLeadGatewayMode() === "gateway") {
      const gatewayMessage = buildGatewayInquiryMessage(messageInput);
      return NextResponse.json({
        ok: true,
        yikeReference,
        redirectUrl: whatsAppDeepLink(yikeWhatsAppNumber(), gatewayMessage),
        handoffUrl: handoffPath(yikeReference),
        gateway: true,
      });
    }

    const message = buildAgentHandoffMessage(messageInput);
    return NextResponse.json({
      ok: true,
      yikeReference,
      redirectUrl: whatsAppDeepLink(wa, message),
      gateway: false,
    });
  }

  const tel = phone || whatsapp;
  if (!tel) {
    return NextResponse.json({ error: "No phone number" }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    yikeReference,
    redirectUrl: `tel:${formatPhoneForTel(tel)}`,
  });
}
