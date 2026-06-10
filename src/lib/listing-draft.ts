import type { ListingTypeValue } from "@/constants/listingTypes";
import { propertyTypesForListingType } from "@/constants/listingTypes";
import type { PropertyMediaItem } from "@/types/database";

const STORAGE_KEY = "yike_listing_draft_v1";
const MAX_AGE_MS = 90 * 86_400_000;

export type ListingDraft = {
  version: 1;
  agentId: string;
  updatedAt: number;
  step: number;
  listingType: ListingTypeValue;
  propertyType: string;
  title: string;
  price: string;
  paymentPeriod: string;
  bedrooms: string;
  bathrooms: string;
  toilets: string;
  state: string;
  city: string;
  area: string;
  landmark: string;
  addressHint: string;
  description: string;
  videoUrl: string;
  amenities: string[];
  valueDriverKeys: string[];
  mediaItems: PropertyMediaItem[];
  transparency: Record<string, string>;
  feeModes: Record<string, string>;
};

export function loadListingDraft(agentId: string): ListingDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as ListingDraft;
    if (draft.agentId !== agentId || draft.version !== 1) return null;
    if (Date.now() - draft.updatedAt > MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

export function saveListingDraft(draft: ListingDraft): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...draft, updatedAt: Date.now() })
    );
  } catch {
    /* quota */
  }
}

export function clearListingDraft(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function draftDisplayLabel(draft: ListingDraft): string {
  if (draft.title.trim()) return draft.title.trim();

  const typeLabel =
    propertyTypesForListingType(draft.listingType).find((o) => o.value === draft.propertyType)
      ?.label ??
    draft.propertyType.replace(/_/g, " ");

  const place = [draft.area, draft.city].filter(Boolean).join(", ");
  if (place) return `${typeLabel} · ${place}`;
  return typeLabel;
}

export function draftThumbUrl(draft: ListingDraft): string | null {
  const item = draft.mediaItems[0];
  if (!item) return null;
  return item.thumbnail_url || item.webp_url || item.image_url || null;
}
