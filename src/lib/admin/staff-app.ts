export const STAFF_APP_START_PATH = "/staff" as const;
export const STAFF_APP_COOKIE = "yike_staff_app" as const;
export const STAFF_APP_MANIFEST_PATH = "/staff/manifest.json" as const;

export function isStaffAppPath(pathname: string): boolean {
  return (
    pathname === STAFF_APP_START_PATH ||
    pathname.startsWith(`${STAFF_APP_START_PATH}/`) ||
    pathname === "/lex" ||
    pathname.startsWith("/lex/")
  );
}

/** Client-side: standalone TWA/PWA opened from staff start URL. */
export function detectStaffStandaloneApp(): boolean {
  if (typeof window === "undefined") return false;
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
    document.referrer.startsWith("android-app://");
  if (!standalone) return false;
  return (
    window.location.pathname.startsWith("/staff") ||
    window.location.pathname.startsWith("/lex") ||
    document.cookie.includes(`${STAFF_APP_COOKIE}=1`)
  );
}
