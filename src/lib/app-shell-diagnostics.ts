import { isAndroidTwa, isStandaloneApp } from "@/lib/app-environment";

export type AppShellDiagnostics = {
  isApp: boolean;
  isAndroidTwa: boolean;
  displayStandalone: boolean;
  displayFullscreen: boolean;
  displayBrowser: boolean;
  referrer: string;
  origin: string;
  userAgent: string;
  htmlClass: string;
  assetLinksStatus?: number;
  assetLinksContentType?: string | null;
  assetLinksPackageFound?: boolean;
};

function matchDisplay(mode: string): boolean {
  try {
    return window.matchMedia(`(display-mode: ${mode})`).matches;
  } catch {
    return false;
  }
}

/** Snapshot client environment for /dev/app-shell diagnostics. */
export function getAppShellDiagnostics(): AppShellDiagnostics {
  if (typeof window === "undefined") {
    return {
      isApp: false,
      isAndroidTwa: false,
      displayStandalone: false,
      displayFullscreen: false,
      displayBrowser: false,
      referrer: "",
      origin: "",
      userAgent: "",
      htmlClass: "",
    };
  }

  return {
    isApp: isStandaloneApp(),
    isAndroidTwa: isAndroidTwa(),
    displayStandalone: matchDisplay("standalone"),
    displayFullscreen: matchDisplay("fullscreen"),
    displayBrowser: matchDisplay("browser"),
    referrer: document.referrer,
    origin: window.location.origin,
    userAgent: navigator.userAgent,
    htmlClass: document.documentElement.className,
  };
}
