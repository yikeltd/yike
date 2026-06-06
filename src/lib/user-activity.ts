import type { BrowsePreferences } from "@/lib/browse-preferences";
import { getBrowsePreferences } from "@/lib/browse-preferences";
import type { RecentlyViewedItem } from "@/lib/recently-viewed";
import { getRecentlyViewed } from "@/lib/recently-viewed";
import type { RecentSearch } from "@/lib/search-recent";
import { getRecentSearches } from "@/lib/search-recent";
import type { SavedSearch } from "@/lib/saved-searches";
import { getSavedSearches } from "@/lib/saved-searches";

export const USER_ACTIVITY_META_KEY = "yike_activity";

export type UserActivitySnapshot = {
  browsePrefs?: BrowsePreferences;
  recentSearches?: RecentSearch[];
  recentlyViewed?: RecentlyViewedItem[];
  savedSearches?: SavedSearch[];
  updatedAt: number;
};

const BROWSE_KEY = "yike_browse_prefs";
const RECENT_SEARCH_KEY = "yike_recent_searches";
const RECENTLY_VIEWED_KEY = "yike_recently_viewed";
const SAVED_SEARCH_KEY = "yike_saved_searches";

export function collectLocalActivity(): UserActivitySnapshot {
  return {
    browsePrefs: getBrowsePreferences(),
    recentSearches: getRecentSearches(),
    recentlyViewed: getRecentlyViewed(),
    savedSearches: getSavedSearches(),
    updatedAt: Date.now(),
  };
}

export function applyActivitySnapshot(snapshot: UserActivitySnapshot) {
  if (typeof window === "undefined") return;
  try {
    if (snapshot.browsePrefs) {
      localStorage.setItem(BROWSE_KEY, JSON.stringify(snapshot.browsePrefs));
    }
    if (snapshot.recentSearches) {
      localStorage.setItem(
        RECENT_SEARCH_KEY,
        JSON.stringify(snapshot.recentSearches.slice(0, 6))
      );
    }
    if (snapshot.recentlyViewed) {
      localStorage.setItem(
        RECENTLY_VIEWED_KEY,
        JSON.stringify(snapshot.recentlyViewed.slice(0, 12))
      );
    }
    if (snapshot.savedSearches) {
      localStorage.setItem(
        SAVED_SEARCH_KEY,
        JSON.stringify(snapshot.savedSearches.slice(0, 8))
      );
    }
  } catch {
    /* ignore */
  }
}

function mergeByKey<T extends { href?: string; id?: string }>(
  a: T[],
  b: T[],
  key: (item: T) => string,
  max: number
): T[] {
  const map = new Map<string, T>();
  for (const item of [...b, ...a]) {
    map.set(key(item), item);
  }
  return [...map.values()].slice(0, max);
}

export function mergeActivitySnapshots(
  local: UserActivitySnapshot,
  remote: UserActivitySnapshot
): UserActivitySnapshot {
  const newer = local.updatedAt >= remote.updatedAt ? local : remote;
  const older = newer === local ? remote : local;

  const browsePrefs =
    (local.browsePrefs?.updatedAt ?? 0) >= (remote.browsePrefs?.updatedAt ?? 0)
      ? local.browsePrefs
      : remote.browsePrefs ?? local.browsePrefs;

  return {
    browsePrefs: browsePrefs ?? newer.browsePrefs ?? older.browsePrefs,
    recentSearches: mergeByKey(
      local.recentSearches ?? [],
      remote.recentSearches ?? [],
      (s) => s.href,
      6
    ),
    recentlyViewed: mergeByKey(
      local.recentlyViewed ?? [],
      remote.recentlyViewed ?? [],
      (v) => v.id,
      12
    ),
    savedSearches: mergeByKey(
      local.savedSearches ?? [],
      remote.savedSearches ?? [],
      (s) => s.href,
      8
    ),
    updatedAt: Math.max(local.updatedAt, remote.updatedAt),
  };
}

export function parseActivitySnapshot(raw: unknown): UserActivitySnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as UserActivitySnapshot;
  if (typeof o.updatedAt !== "number") return null;
  return o;
}
