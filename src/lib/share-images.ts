import { SITE_URL } from "@/lib/constants";
import { optimizeListingImageUrl } from "@/lib/image-url";

/** Default brand preview for homepage and non-listing links (WhatsApp, Telegram, etc.) */
export const BRAND_OG_IMAGE = `${SITE_URL}/images/og-share.png`;
export const BRAND_OG_IMAGE_WEBP = `${SITE_URL}/images/og-share.webp`;

/** Absolute HTTPS URL for a listing photo — used in Open Graph / Twitter cards. */
export function listingShareImageUrl(mediaUrls: string[] | null | undefined): string {
  const raw = mediaUrls?.find((url) => typeof url === "string" && url.startsWith("http"));
  if (!raw) return BRAND_OG_IMAGE;
  return optimizeListingImageUrl(raw, 1200);
}
