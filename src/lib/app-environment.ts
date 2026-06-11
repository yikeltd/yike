/**
 * Installed PWA / Android TWA detection.
 * Used to hide website footer, skip browser SW, and avoid browser-style loaders.
 * Normal browser tabs always get yike-web-mode — SEO and desktop UX unchanged.
 */

function matchesDisplayMode(mode: string): boolean {
  try {
    return window.matchMedia(`(display-mode: ${mode})`).matches;
  } catch {
    return false;
  }
}

/** True when launched from the Android TWA wrapper (com.yike.app). */
export function isAndroidTwa(): boolean {
  if (typeof window === "undefined") return false;
  const ref = document.referrer ?? "";
  if (ref.startsWith("android-app://")) return true;
  return false;
}

/** True when running as installed PWA or Android TWA. */
export function isStandaloneApp(): boolean {
  if (typeof window === "undefined") return false;
  if (isAndroidTwa()) return true;
  if (matchesDisplayMode("standalone")) return true;
  if (matchesDisplayMode("fullscreen")) return true;
  if (matchesDisplayMode("minimal-ui")) return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) return true;
  return false;
}
