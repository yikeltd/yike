const KEY = "yike_guest_favorites";
const MAX = 40;

export function getGuestFavoriteIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function isGuestFavorite(propertyId: string): boolean {
  return getGuestFavoriteIds().includes(propertyId);
}

export function toggleGuestFavorite(propertyId: string): boolean {
  const prev = getGuestFavoriteIds().filter((id) => id !== propertyId);
  const wasSaved = prev.length < getGuestFavoriteIds().length;
  const next = wasSaved ? prev : [propertyId, ...prev].slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(next));
  return !wasSaved;
}

export function clearGuestFavorites() {
  localStorage.removeItem(KEY);
}
