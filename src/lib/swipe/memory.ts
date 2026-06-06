const KEY = "yike_swipe_memory";
const LABEL_CACHE = "yike_swipe_label_cache";

export type SwipeMemory = {
  listingId: string;
  index: number;
  city?: string;
  area?: string;
  propertyTypes: string[];
  budgetMax?: number;
  budgetMin?: number;
  updatedAt: number;
};

function emptyMemory(): SwipeMemory {
  return {
    listingId: "",
    index: 0,
    propertyTypes: [],
    updatedAt: 0,
  };
}

export function getSwipeMemory(): SwipeMemory | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null") as SwipeMemory | null;
    if (!raw?.listingId) return null;
    if (Date.now() - raw.updatedAt > 7 * 24 * 60 * 60 * 1000) return null;
    return {
      ...emptyMemory(),
      ...raw,
      propertyTypes: raw.propertyTypes ?? [],
    };
  } catch {
    return null;
  }
}

export function saveSwipeMemory(partial: {
  listingId: string;
  index: number;
  city?: string;
  area?: string;
  propertyType?: string | null;
  price?: number;
}) {
  if (typeof window === "undefined") return;
  try {
    const prev = getSwipeMemory();
    const propertyTypes = partial.propertyType
      ? [
          partial.propertyType,
          ...(prev?.propertyTypes ?? []).filter((t) => t !== partial.propertyType),
        ].slice(0, 5)
      : prev?.propertyTypes ?? [];

    const prefs = partial.price
      ? {
          budgetMax: prev?.budgetMax,
          budgetMin: prev?.budgetMin,
        }
      : {};

    localStorage.setItem(
      KEY,
      JSON.stringify({
        listingId: partial.listingId,
        index: partial.index,
        city: partial.city ?? prev?.city,
        area: partial.area ?? prev?.area,
        propertyTypes,
        budgetMax: prefs.budgetMax,
        budgetMin: prefs.budgetMin,
        updatedAt: Date.now(),
      } satisfies SwipeMemory)
    );
  } catch {
    /* ignore */
  }
}

/** Cache motion labels for next card — instant label render on swipe. */
export function cacheSlideLabels(listingId: string, labels: string[]) {
  if (typeof window === "undefined" || labels.length === 0) return;
  try {
    const cache = JSON.parse(
      sessionStorage.getItem(LABEL_CACHE) ?? "{}"
    ) as Record<string, string[]>;
    cache[listingId] = labels.slice(0, 12);
    const keys = Object.keys(cache);
    if (keys.length > 24) {
      delete cache[keys[0]!];
    }
    sessionStorage.setItem(LABEL_CACHE, JSON.stringify(cache));
  } catch {
    /* ignore */
  }
}

export function getCachedSlideLabels(listingId: string): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const cache = JSON.parse(
      sessionStorage.getItem(LABEL_CACHE) ?? "{}"
    ) as Record<string, string[]>;
    return cache[listingId] ?? null;
  } catch {
    return null;
  }
}

export function resolveSwipeResumeIndex(
  feedIds: string[],
  memory: SwipeMemory | null
): number {
  if (!memory || feedIds.length === 0) return 0;
  const idx = feedIds.indexOf(memory.listingId);
  return idx >= 0 ? idx : 0;
}

export function continueBrowsingHint(memory: SwipeMemory | null): string | null {
  if (!memory) return null;
  if (memory.area && memory.city) {
    return `Continue browsing homes in ${memory.area}, ${memory.city}`;
  }
  if (memory.city) return `Continue browsing homes in ${memory.city}`;
  return null;
}
