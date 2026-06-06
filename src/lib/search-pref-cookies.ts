const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Sync browse prefs to cookies so server pages can personalize listings. */
export function syncSearchPrefCookies(partial: {
  city?: string;
  area?: string;
  listingType?: string;
}) {
  if (typeof document === "undefined") return;
  const base = `path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
  if (partial.city) {
    document.cookie = `yike_pref_city=${encodeURIComponent(partial.city)};${base}`;
  }
  if (partial.area) {
    document.cookie = `yike_pref_area=${encodeURIComponent(partial.area)};${base}`;
  }
  if (partial.listingType) {
    document.cookie = `yike_pref_type=${encodeURIComponent(partial.listingType)};${base}`;
  }
}
