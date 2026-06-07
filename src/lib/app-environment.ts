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

