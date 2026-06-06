/** WhatsApp lead gateway — Yike owns first touch, agent gets handoff. */

import { SITE_URL, YIKE_SUPPORT_WHATSAPP } from "@/lib/constants";

export function isLeadGatewayEnabled(): boolean {
  return process.env.YIKE_LEAD_GATEWAY_ENABLED?.trim() !== "false";
}

/** Official Yike WhatsApp line for lead gateway and support. */
export function yikeWhatsAppNumber(): string {
  return (
    process.env.YIKE_WHATSAPP_NUMBER?.trim() ||
    process.env.SENDCHAMP_WHATSAPP_SENDER?.trim() ||
    YIKE_SUPPORT_WHATSAPP
  );
}

/** Listing WhatsApp taps always route through Yike first when gateway is enabled. */
export function resolveLeadGatewayMode(): "gateway" | "direct" {
  if (!isLeadGatewayEnabled()) return "direct";
  return "gateway";
}

export function handoffPath(yikeReference: string): string {
  return `/l/${encodeURIComponent(yikeReference)}`;
}

export function absoluteHandoffUrl(yikeReference: string): string {
  return `${SITE_URL}${handoffPath(yikeReference)}`;
}
