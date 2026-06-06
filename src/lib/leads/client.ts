"use client";

import { getGuestId } from "@/lib/guest-id";
import { trackContactClick, type ContactPlacement } from "@/lib/contact-tracking";
import { recordPwaWhatsAppClick } from "@/lib/pwa/engagement";
import { whatsAppDeepLink } from "@/lib/whatsapp";
import { formatPhoneForTel } from "@/lib/utils";
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

export async function trackLeadAndRedirect(
  input: TrackLeadInput
): Promise<{ ok: boolean; redirectUrl?: string; error?: string }> {
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
      if (input.leadType === "whatsapp") recordPwaWhatsAppClick();
      return { ok: true, redirectUrl: fallback };
    }
    return { ok: false, error: data.error ?? "Lead tracking failed" };
  }

  if (input.leadType === "whatsapp") {
    recordPwaWhatsAppClick();
  }

  return { ok: true, redirectUrl: data.redirectUrl as string };
}

function buildFallbackRedirect(input: TrackLeadInput): string | undefined {
  if (input.leadType === "whatsapp") {
    const wa = input.whatsapp || input.phone;
    if (!wa) return undefined;
    const msg = `Hi ${input.agentName}, I'm interested in ${input.title} in ${input.area}, ${input.city} on Yike.`;
    return whatsAppDeepLink(wa, msg);
  }
  const tel = input.phone || input.whatsapp;
  if (!tel) return undefined;
  return `tel:${formatPhoneForTel(tel)}`;
}
