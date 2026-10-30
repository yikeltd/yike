import type { ElectronicsListingInput } from "@/lib/marketplace/listings";
import {
  ELECTRONICS_CATEGORIES,
  ELECTRONICS_CONDITIONS,
  type ElectronicsCategoryId,
} from "@/lib/marketplace/electronics-specs";
import {
  LISTING_CREATE_MAX_PHOTOS,
  LISTING_CREATE_MIN_PHOTOS,
} from "@/lib/listing-create/constants";
import { isSafeListingMediaUrl } from "@/lib/listing-create/media-url";

export const ELECTRONICS_CREATE_MIN_PHOTOS = LISTING_CREATE_MIN_PHOTOS;
export const ELECTRONICS_CREATE_MAX_PHOTOS = LISTING_CREATE_MAX_PHOTOS;

const VALID_CONDITIONS = new Set(ELECTRONICS_CONDITIONS.map((c) => c.id));

export function parseElectronicsBody(
  body: Record<string, unknown>,
): ElectronicsListingInput | null {
  const auto_category = String(body.auto_category ?? "").trim() as ElectronicsCategoryId;
  if (!ELECTRONICS_CATEGORIES.some((c) => c.id === auto_category)) return null;

  const title = String(body.title ?? "").trim();
  const brand = String(body.brand ?? body.make ?? "").trim();
  const model = String(body.model ?? "").trim();
  const price = Number(body.price);
  const state = String(body.state ?? "").trim();
  const city = String(body.city ?? "").trim();
  const condition = String(body.condition ?? "").trim();

  if (!title || !brand || !model || !state || !city || !condition) return null;
  if (!VALID_CONDITIONS.has(condition as (typeof ELECTRONICS_CONDITIONS)[number]["id"])) {
    return null;
  }
  if (!Number.isFinite(price) || price <= 0) return null;

  const media = Array.isArray(body.media_urls)
    ? body.media_urls.map(String).filter(Boolean)
    : [];

  if (
    media.length < ELECTRONICS_CREATE_MIN_PHOTOS ||
    media.length > ELECTRONICS_CREATE_MAX_PHOTOS ||
    media.some((url) => !isSafeListingMediaUrl(url))
  ) {
    return null;
  }

  const attributes =
    body.attributes && typeof body.attributes === "object"
      ? (body.attributes as Record<string, unknown>)
      : {};

  return {
    title,
    description: body.description != null ? String(body.description) : undefined,
    price,
    state,
    city,
    area: body.area != null ? String(body.area) : city,
    auto_category,
    media_urls: media,
    video_url: body.video_url != null ? String(body.video_url) : null,
    brand,
    model,
    condition,
    attributes,
  };
}

export { buildElectronicsInsertPayload } from "@/lib/marketplace/listings";
