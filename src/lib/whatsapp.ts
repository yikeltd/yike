import { normalizeWhatsApp, propertyTypeLabel } from "./utils";

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
  propertyId: string,
  options?: {
    bedrooms?: number;
    propertyType?: string | null;
    listingType?: string;
  }
): string {
  const location = area ? `${area}, ${city}` : city;
  const beds =
    options?.bedrooms && options.bedrooms > 0
      ? `${options.bedrooms} bedroom `
      : "";
  const type = options?.propertyType
    ? `${propertyTypeLabel(options.propertyType).toLowerCase()} `
    : title
      ? `${title.toLowerCase()} `
      : "property ";

  return `Hi, I saw your listing on Yike for the ${beds}${type.trim()} in ${location}. Is it still available?`;
}
