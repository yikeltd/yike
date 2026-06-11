import type { Property } from "@/types/database";
import { normalizePropertyMedia, displayUrl, cardDisplayUrl } from "@/lib/media/items";

/** Full-quality URLs for detail gallery — prefers large variant. */
export function listingGalleryImages(property: Property): string[] {
  const items = normalizePropertyMedia(property);
  if (items.length > 0) {
    const urls = items.map((item) => displayUrl(item)).filter((u) => u.startsWith("http"));
    if (urls.length > 0) return urls;
  }
  return property.media_urls?.length ? property.media_urls : ["/placeholder-property.svg"];
}

/** Sharp-enough thumbnail for cards and rails. */
export function listingCardImage(property: Property): string {
  const items = normalizePropertyMedia(property);
  if (items[0]) {
    const url = cardDisplayUrl(items[0]);
    if (url.startsWith("http")) return url;
  }
  return property.media_urls[0] ?? "/placeholder-property.svg";
}
