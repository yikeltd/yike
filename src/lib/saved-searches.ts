const KEY = "yike_saved_searches";
const MAX = 8;

export type SavedSearch = {
  label: string;
  href: string;
  savedAt: number;
};

export function getSavedSearches(): SavedSearch[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as SavedSearch[];
  } catch {
    return [];
  }
}

export function saveSearch(entry: { label: string; href: string }) {
  const prev = getSavedSearches().filter((s) => s.href !== entry.href);
  const saved: SavedSearch = { ...entry, savedAt: Date.now() };
  localStorage.setItem(KEY, JSON.stringify([saved, ...prev].slice(0, MAX)));
}

export function removeSavedSearch(href: string) {
  const next = getSavedSearches().filter((s) => s.href !== href);
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function isSearchSaved(href: string): boolean {
  return getSavedSearches().some((s) => s.href === href);
}
