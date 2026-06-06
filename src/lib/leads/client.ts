"use client";

import { getGuestId } from "@/lib/guest-id";
import { trackContactClick, type ContactPlacement } from "@/lib/contact-tracking";
import { buildGatewayInquiryMessage } from "@/lib/leads/message";
import { generateLeadReference } from "@/lib/leads/reference";
import { handoffPath, yikeWhatsAppNumber } from "@/lib/leads/gateway";
import { whatsAppDeepLink } from "@/lib/whatsapp";
import { formatPhoneForTel } from "@/lib/utils";
import type { PaymentPeriod, ListingType } from "@/types/database";
import type { LeadType } from "./types";

export type TrackLeadInput = {
  listingId: string;
  agentId: string;
  leadType: LeadType;
  sourcePage: string;
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
};

export async function trackLeadAndRedirect(
  input: TrackLeadInput
): Promise<TrackLeadResult> {
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
    const fallback = buildFallbackRedirect(input);
    if (fallback) {
      return fallback;
    }
    return { ok: false, error: data.error ?? "Lead tracking failed" };
  }

  return {
    ok: true,
    redirectUrl: data.redirectUrl as string,
    handoffUrl: data.handoffUrl as string | undefined,
  };
}

function buildFallbackRedirect(input: TrackLeadInput): TrackLeadResult | undefined {
  if (input.leadType === "whatsapp") {
    const ref = generateLeadReference(input.city, input.area);
    const message = buildGatewayInquiryMessage({
      price: input.price,
      paymentPeriod: input.paymentPeriod as PaymentPeriod,
      listingType: input.listingType as ListingType,
      propertyTitle: input.title,
      area: input.area,
      city: input.city,
      bedrooms: input.bedrooms,
      propertyType: input.propertyType,
      yikeReference: ref,
    });
    return {
      ok: true,
      redirectUrl: whatsAppDeepLink(yikeWhatsAppNumber(), message),
      handoffUrl: handoffPath(ref),
    };
  }
  const tel = input.phone || input.whatsapp;
  if (!tel) return undefined;
  return { ok: true, redirectUrl: `tel:${formatPhoneForTel(tel)}` };
}
