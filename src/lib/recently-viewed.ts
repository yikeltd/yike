const KEY = "yike_recently_viewed";
const MAX = 12;

export type RecentlyViewedItem = {
  id: string;
  title: string;
  image: string;
  city: string;
  area: string;
  priceLabel: string;
  viewedAt: number;
};

export function getRecentlyViewed(): RecentlyViewedItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as RecentlyViewedItem[];
  } catch {
    return [];
  }
}

export function addRecentlyViewed(item: Omit<RecentlyViewedItem, "viewedAt">) {
  const prev = getRecentlyViewed().filter((v) => v.id !== item.id);
  const entry: RecentlyViewedItem = { ...item, viewedAt: Date.now() };
  localStorage.setItem(KEY, JSON.stringify([entry, ...prev].slice(0, MAX)));
}

export function clearRecentlyViewed() {
  localStorage.removeItem(KEY);
}
