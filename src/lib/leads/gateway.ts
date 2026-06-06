/** WhatsApp lead gateway — Yike owns first touch, agent gets handoff. */

import { SITE_URL } from "@/lib/constants";

export function isLeadGatewayEnabled(): boolean {
  return process.env.YIKE_LEAD_GATEWAY_ENABLED?.trim() === "true";
}

export function yikeWhatsAppNumber(): string | null {
  const n =
    process.env.YIKE_WHATSAPP_NUMBER?.trim() ||
    process.env.SENDCHAMP_WHATSAPP_SENDER?.trim();
  return n || null;
}

export function resolveLeadGatewayMode(): "gateway" | "direct" {
  if (!isLeadGatewayEnabled()) return "direct";
  if (!yikeWhatsAppNumber()) return "direct";
  return "gateway";
}

export function handoffPath(yikeReference: string): string {
  return `/l/${encodeURIComponent(yikeReference)}`;
}

export function absoluteHandoffUrl(yikeReference: string): string {
  return `${SITE_URL}${handoffPath(yikeReference)}`;
}
