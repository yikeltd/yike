import { buildLocationHelpMessage } from "@/lib/leads/message";
import { yikeWhatsAppNumber } from "@/lib/leads/gateway";
import { whatsAppDeepLink } from "@/lib/whatsapp";

export function buildSeoHelpWhatsAppUrl(city: string, area?: string): string {
  return whatsAppDeepLink(
    yikeWhatsAppNumber(),
    buildLocationHelpMessage(city, area)
  );
}

export function seoHelpLabel(city: string, area?: string): string {
  const place = area ? `${area}, ${city}` : city;
  return `Need help finding a home in ${place}?`;
}
