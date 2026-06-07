"use client";

import { getGuestId } from "@/lib/guest-id";
import { trackContactClick, type ContactPlacement } from "@/lib/contact-tracking";
import { buildGatewayInquiryMessage } from "@/lib/leads/message";
import { listingUrlFromSourcePage } from "@/lib/leads/whatsapp-urls";
import { generateLeadReference } from "@/lib/leads/reference";
import { handoffPath, yikeWhatsAppNumber } from "@/lib/leads/gateway";
import { whatsAppDeepLink } from "@/lib/whatsapp";
import { COOLDOWN_USER_MESSAGE } from "@/lib/leads/operations-types";
import { markListingContacted } from "@/lib/recently-contacted";
import { logFunnelEvent } from "@/lib/analytics/whatsapp-funnel";
import type { LeadType } from "./types";

export type TrackLeadInput = {
  listingId: string;
  agentId: string;
  leadType: LeadType;
  sourcePage: string;
  sourceSurface?: string;
  sourceListingPosition?: number;
  sourceCampaign?: string;
  placement: ContactPlacement;
  agentName: string;
  title: string;
  area: string;
  city: string;
  price: number;
  paymentPeriod: string;
  listingType: string;
  bedrooms?: number;
  propertyType?: string | null;
  whatsapp?: string | null;
  phone?: string | null;
};

export type TrackLeadResult = {
  ok: boolean;
  redirectUrl?: string;
  handoffUrl?: string;
  error?: string;
  cooldown?: boolean;
  listingNotice?: string | null;
  callAllowed?: boolean;
  routeType?: "direct_call" | "whatsapp_fallback";
  yikeReference?: string;
};

export function openWhatsAppLead(result: TrackLeadResult): void {
  if (!result.redirectUrl) return;
  window.open(result.redirectUrl, "_blank", "noopener,noreferrer");
  if (result.handoffUrl) {
    window.setTimeout(() => {
      window.location.href = result.handoffUrl!;
    }, 400);
  }
}

export async function trackLeadAndRedirect(
  input: TrackLeadInput
): Promise<TrackLeadResult> {
  logFunnelEvent({
    eventType:
      input.leadType === "call"
        ? "call_button_clicked"
        : "whatsapp_button_clicked",
    listingId: input.listingId,
    agentId: input.agentId,
    sourcePage: input.sourcePage,
    sourceSurface: input.sourceSurface,
    guestId: getGuestId(),
  });

  void trackContactClick({
    propertyId: input.listingId,
    channel: input.leadType,
    city: input.city,
    area: input.area,
    listingType: input.listingType,
    propertyType: input.propertyType,
    placement: input.placement,
    agentId: input.agentId,
  });

  const res = await fetch("/api/leads/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...input,
      guestId: getGuestId(),
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 429 || data.cooldown) {
      return {
        ok: false,
        cooldown: true,
        error: (data.error as string) ?? COOLDOWN_USER_MESSAGE,
      };
    }
    const fallback = buildFallbackRedirect(input);
    if (fallback) {
      return fallback;
    }
    return { ok: false, error: data.error ?? "Lead tracking failed" };
  }

  markListingContacted(input.listingId);

  logFunnelEvent({
    eventType: "lead_created",
    listingId: input.listingId,
    agentId: input.agentId,
    sourcePage: input.sourcePage,
    sourceSurface: input.sourceSurface,
    guestId: getGuestId(),
    metadata: {
      leadType: input.leadType,
      routeType: data.routeType,
      yikeReference: data.yikeReference,
    },
  });

  if (input.leadType === "call" && data.callAllowed) {
    logFunnelEvent({
      eventType: "direct_call_used",
      listingId: input.listingId,
      agentId: input.agentId,
      sourcePage: input.sourcePage,
      sourceSurface: input.sourceSurface,
      guestId: getGuestId(),
    });
  } else if (input.leadType === "whatsapp") {
    logFunnelEvent({
      eventType: data.routeType === "direct_call" ? "direct_whatsapp_used" : "whatsapp_opened",
      listingId: input.listingId,
      agentId: input.agentId,
      sourcePage: input.sourcePage,
      sourceSurface: input.sourceSurface,
      guestId: getGuestId(),
    });
  }

  return {
    ok: true,
    redirectUrl: data.redirectUrl as string | undefined,
    handoffUrl: data.handoffUrl as string | undefined,
    listingNotice: (data.listingNotice as string | null | undefined) ?? null,
    callAllowed: data.callAllowed as boolean | undefined,
    routeType: data.routeType as TrackLeadResult["routeType"],
    yikeReference: data.yikeReference as string | undefined,
  };
}

function buildFallbackRedirect(input: TrackLeadInput): TrackLeadResult | undefined {
  if (input.leadType === "whatsapp") {
    const ref = generateLeadReference(input.city, input.area);
    const listingUrl = listingUrlFromSourcePage(input.sourcePage);
    const message = buildGatewayInquiryMessage({
      propertyTitle: input.title,
      publicListingCode: ref,
      publicAgentCode: "inquiry",
      listingUrl,
    });
    return {
      ok: true,
      redirectUrl: whatsAppDeepLink(yikeWhatsAppNumber(), message),
      handoffUrl: handoffPath(ref),
      yikeReference: ref,
    };
  }
  return undefined;
}
