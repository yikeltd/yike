import { TRENDING_SEARCH_LINKS } from "@/constants/popularAreas";

const KEY = "yike_recent_searches";
const MAX = 6;

export type RecentSearch = {
  label: string;
  href: string;
};

export function getRecentSearches(): RecentSearch[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as RecentSearch[];
  } catch {
    return [];
  }
}

export function addRecentSearch(entry: RecentSearch) {
  const prev = getRecentSearches().filter((s) => s.href !== entry.href);
  localStorage.setItem(KEY, JSON.stringify([entry, ...prev].slice(0, MAX)));
}

export const TRENDING_AREAS: RecentSearch[] = TRENDING_SEARCH_LINKS;
