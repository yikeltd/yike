/** True when running as installed PWA or Android TWA (standalone display). */
export function isStandaloneApp(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(display-mode: standalone)");
  if (mq.matches) return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) return true;
  if (document.referrer.startsWith("android-app://")) return true;
  return false;
}

/** Core product routes — no marketing footer even on desktop. */
export function isAppShellRoute(pathname: string): boolean {
  if (pathname === "/") return true;
  const prefixes = [
    "/search",
    "/saved",
    "/profile",
    "/agent",
    "/browse",
    "/properties/",
    "/explore",
    "/rent",
    "/buy",
    "/shortlet",
    "/land",
    "/post-property",
  ];
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
