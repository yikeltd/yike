const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function cookieBase() {
  return `path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
}

/** Sync browse prefs to cookies so server pages can personalize listings. */
export function syncSearchPrefCookies(partial: {
  city?: string;
  area?: string;
  listingType?: string;
}) {
  if (typeof document === "undefined") return;
  const base = cookieBase();
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

/** Marketplace location preference cookies (state/city/coords). */
export function syncMarketplaceLocationCookies(partial: {
  state?: string;
  city?: string;
  area?: string;
  lat?: number;
  lng?: number;
  clear?: boolean;
}) {
  if (typeof document === "undefined") return;
  const base = cookieBase();
  const expire = "path=/;max-age=0;SameSite=Lax";

  if (partial.clear) {
    document.cookie = `yike_pref_city=;${expire}`;
    document.cookie = `yike_pref_area=;${expire}`;
    document.cookie = `yike_pref_state=;${expire}`;
    document.cookie = `yike_pref_lat=;${expire}`;
    document.cookie = `yike_pref_lng=;${expire}`;
    return;
  }

  // Always write city (may be empty for state-wide / clearing city)
  if (partial.city !== undefined) {
    if (partial.city) {
      document.cookie = `yike_pref_city=${encodeURIComponent(partial.city)};${base}`;
    } else {
      document.cookie = `yike_pref_city=;${expire}`;
    }
  }
  if (partial.area !== undefined) {
    if (partial.area) {
      document.cookie = `yike_pref_area=${encodeURIComponent(partial.area)};${base}`;
    } else {
      document.cookie = `yike_pref_area=;${expire}`;
    }
  }
  if (partial.state !== undefined) {
    if (partial.state) {
      document.cookie = `yike_pref_state=${encodeURIComponent(partial.state)};${base}`;
    } else {
      document.cookie = `yike_pref_state=;${expire}`;
    }
  }
  if (partial.lat != null && Number.isFinite(partial.lat)) {
    document.cookie = `yike_pref_lat=${encodeURIComponent(String(partial.lat))};${base}`;
  } else if (partial.lat === undefined && partial.city !== undefined) {
    document.cookie = `yike_pref_lat=;${expire}`;
  }
  if (partial.lng != null && Number.isFinite(partial.lng)) {
    document.cookie = `yike_pref_lng=${encodeURIComponent(String(partial.lng))};${base}`;
  } else if (partial.lng === undefined && partial.city !== undefined) {
    document.cookie = `yike_pref_lng=;${expire}`;
  }
}
