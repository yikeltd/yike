import type { ListingTypeValue } from "@/constants/listingTypes";
import type { Property, PropertyMediaItem } from "@/types/database";
import type { PhotoSchema } from "@/lib/listing-engine/photo-schema";
import {
  migratePhotoLabel,
  preferredCoverLabelSet,
  poorCoverLabelSet,
  resolvePropertyPhotoSchema,
  storyOrderForSchemaLabel,
  suggestLabelFromSchema,
} from "@/lib/listing-engine/photo-schema";
import { fallbackPhotoLabel } from "@/lib/media/labels";
import {
  mediaCoverScore,
  mediaItemQualityPenalty,
} from "@/lib/swipe/image-heuristics";

export type { PropertyMediaItem };

export type MotionSlideFrame = {
  key: string;
  url: string;
  label: string;
  subLabel?: string;
  alt: string;
  blurDataUrl?: string;
};

function newMediaId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `media_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function defaultPropertySchema(
  propertyType?: string,
  listingType?: ListingTypeValue
): PhotoSchema {
  return resolvePropertyPhotoSchema({ propertyType, listingType });
}

/** Primary display URL — large variant when available. */
export function displayUrl(item: PropertyMediaItem): string {
  return item.image_url || item.webp_url || "";
}

/** Card / rail thumbnail — medium variant for sharp cards without full large weight. */
export function cardDisplayUrl(item: PropertyMediaItem): string {
  return item.webp_url || item.image_url || item.thumbnail_url || "";
}

/** Build items from legacy media_urls array. */
export function urlsToMediaItems(
  urls: string[],
  schema?: PhotoSchema
): PropertyMediaItem[] {
  const active = schema ?? defaultPropertySchema();
  return urls.map((url, i) => ({
    id: newMediaId(),
    image_url: url,
    webp_url: url,
    room_label: suggestLabelFromSchema(active, i),
    sort_order: i,
    is_cover: i === 0,
    created_at: new Date().toISOString(),
  }));
}

export function mediaItemsToUrls(items: PropertyMediaItem[]): string[] {
  return sortMediaItemsForStory(items).map((i) => displayUrl(i));
}

export function normalizePropertyMedia(
  property: Property,
  schema?: PhotoSchema
): PropertyMediaItem[] {
  const active =
    schema ??
    defaultPropertySchema(
      property.property_type ?? undefined,
      property.listing_type as ListingTypeValue | undefined
    );
  const raw = property.media_items;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((item, i) => ({
      ...item,
      sort_order: item.sort_order ?? i,
      image_url: item.image_url || item.webp_url || "",
      webp_url: item.webp_url || item.image_url,
      room_label: item.room_label
        ? migratePhotoLabel(active, item.room_label)
        : item.room_label,
    }));
  }
  if (property.media_urls?.length) {
    return urlsToMediaItems(property.media_urls, active);
  }
  return [];
}

export function sortMediaItemsForStory(
  items: PropertyMediaItem[],
  schema?: PhotoSchema
): PropertyMediaItem[] {
  const active = schema ?? defaultPropertySchema();
  const preferred = preferredCoverLabelSet(active);
  const poor = poorCoverLabelSet(active);

  const sorted = [...items].sort((a, b) => {
    const coverA = a.is_cover ? 0 : 1;
    const coverB = b.is_cover ? 0 : 1;
    if (coverA !== coverB) return coverA - coverB;
    const story =
      storyOrderForSchemaLabel(active, a.room_label) -
      storyOrderForSchemaLabel(active, b.room_label);
    if (story !== 0) return story;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  const coverIdx = pickCoverIndex(sorted, preferred, poor);
  if (coverIdx > 0) {
    const [cover] = sorted.splice(coverIdx, 1);
    cover.is_cover = true;
    sorted.unshift(cover);
  } else if (sorted[0]) {
    sorted[0].is_cover = true;
  }

  return sorted.map((item, i) => ({ ...item, sort_order: i }));
}

function pickCoverIndex(
  items: PropertyMediaItem[],
  preferred: Set<string>,
  poor: Set<string>
): number {
  const manual = items.findIndex((i) => i.is_cover);
  if (manual >= 0) return manual;

  let bestIdx = 0;
  let bestScore = -Infinity;

  items.forEach((item, idx) => {
    let score = mediaCoverScore(item);
    const label = item.room_label ?? "";
    if (preferred.has(label)) score += 40;
    if (poor.has(label)) score -= 30;
    score -= mediaItemQualityPenalty(item);
    score -= idx * 0.5;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = idx;
    }
  });

  return bestIdx;
}

export function createMediaItemFromUpload(input: {
  url: string;
  medium: string;
  thumbnail: string;
  index: number;
  width?: number;
  height?: number;
  blur_data_url?: string;
  photoSchema?: PhotoSchema;
  /** @deprecated Prefer photoSchema */
  propertyType?: string;
  /** @deprecated Prefer photoSchema */
  listingType?: ListingTypeValue;
}): PropertyMediaItem {
  const schema =
    input.photoSchema ??
    defaultPropertySchema(input.propertyType, input.listingType);
  return {
    id: newMediaId(),
    image_url: input.url,
    webp_url: input.medium || input.url,
    thumbnail_url: input.thumbnail,
    blur_data_url: input.blur_data_url,
    room_label: suggestLabelFromSchema(schema, input.index),
    sort_order: input.index,
    width: input.width,
    height: input.height,
    is_cover: input.index === 0,
    created_at: new Date().toISOString(),
  };
}

/** Frames for motion swipe — cover slide uses listing title + location. */
export function buildMotionSlides(property: Property): MotionSlideFrame[] {
  const schema = defaultPropertySchema(
    property.property_type ?? undefined,
    property.listing_type as ListingTypeValue | undefined
  );
  const items = sortMediaItemsForStory(
    normalizePropertyMedia(property, schema),
    schema
  );
  if (items.length === 0) {
    return [
      {
        key: "placeholder",
        url: "/placeholder-property.svg",
        label: property.title,
        subLabel: `${property.area}, ${property.city}`,
        alt: property.title,
      },
    ];
  }

  return items.map((item, i) => {
    const url =
      item.thumbnail_url && i > 0 ? item.thumbnail_url : displayUrl(item);
    const label =
      item.room_label && item.room_label !== "Other"
        ? String(item.room_label)
        : fallbackPhotoLabel(i);

    const blurDataUrl = item.blur_data_url ?? undefined;

    if (i === 0 || item.is_cover) {
      return {
        key: item.id,
        url,
        label: property.title,
        subLabel: `${property.area}, ${property.city}`,
        alt: item.alt_text || property.title,
        blurDataUrl,
      };
    }

    return {
      key: item.id,
      url,
      label,
      alt: item.alt_text || `${label} — ${property.title}`,
      blurDataUrl,
    };
  });
}

export function applyDefaultLabels(
  items: PropertyMediaItem[],
  schemaOrPropertyType?: PhotoSchema | string,
  listingType?: ListingTypeValue
): PropertyMediaItem[] {
  const schema =
    typeof schemaOrPropertyType === "object" && schemaOrPropertyType !== null
      ? schemaOrPropertyType
      : defaultPropertySchema(schemaOrPropertyType, listingType);
  return items.map((item, i) => ({
    ...item,
    room_label: item.room_label
      ? migratePhotoLabel(schema, item.room_label)
      : suggestLabelFromSchema(schema, i),
    sort_order: i,
  }));
}

export function setCoverItem(
  items: PropertyMediaItem[],
  id: string
): PropertyMediaItem[] {
  return items.map((item) => ({
    ...item,
    is_cover: item.id === id,
  }));
}

export function reorderMediaItems(
  items: PropertyMediaItem[],
  from: number,
  to: number
): PropertyMediaItem[] {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  if (!moved) return items;
  next.splice(to, 0, moved);
  return next.map((item, i) => ({ ...item, sort_order: i }));
}

export function removeMediaItem(
  items: PropertyMediaItem[],
  id: string
): PropertyMediaItem[] {
  return items
    .filter((i) => i.id !== id)
    .map((item, idx) => ({ ...item, sort_order: idx }));
}

/** Dedupe URLs — reduces poor swipe quality from duplicate uploads. */
export function dedupeMediaItems(items: PropertyMediaItem[]): PropertyMediaItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = displayUrl(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
