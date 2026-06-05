import { normalizeWhatsApp } from "./utils";

export function whatsAppDeepLink(
  phone: string,
  message?: string
): string {
  const number = normalizeWhatsApp(phone);
  const base = `https://wa.me/${number}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function propertyWhatsAppMessage(
  title: string,
  area: string,
  city: string,
  propertyId: string
): string {
  return `Hi, I saw your listing "${title}" in ${area}, ${city} on Yike.ng. Is it still available? (Ref: ${propertyId.slice(0, 8)})`;
}
