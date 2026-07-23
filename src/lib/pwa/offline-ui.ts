/** Session + local flags for offline UX (no network). */

export const WARM_SESSION_KEY = "yike-warm-session";
export const WARM_HOME_KEY = "yike-warm-home";

export function markWarmSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(WARM_SESSION_KEY, "1");
    window.localStorage.setItem(WARM_HOME_KEY, "1");
  } catch {
    /* private mode */
  }
}

export function hasWarmHomeCacheFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(WARM_HOME_KEY) === "1";
  } catch {
    return false;
  }
}

export function isBrowserOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

/** Soft-block network actions; returns true when the action may proceed. */
export function allowNetworkAction(): boolean {
  return isBrowserOnline();
}
