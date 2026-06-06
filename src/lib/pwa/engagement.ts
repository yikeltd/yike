import { getViewedListingIds } from "@/lib/browse-preferences";
import { getEngagementSaveCount, getVisitCount } from "@/lib/engagement";

const DISMISS_KEY = "yike_pwa_dismissed";
const SWIPES_KEY = "yike_pwa_swipes";
const WHATSAPP_KEY = "yike_pwa_whatsapp_clicks";
const DISMISS_DAYS = 14;

export const PWA_CHECK_EVENT = "yike:pwa-check";

function readCount(key: string): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(key) ?? "0");
}

function bump(key: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, String(readCount(key) + 1));
    notifyPwaEligibilityCheck();
  } catch {
    /* ignore */
  }
}

export function notifyPwaEligibilityCheck() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PWA_CHECK_EVENT));
}

export function recordPwaSwipe() {
  bump(SWIPES_KEY);
}

export function recordPwaWhatsAppClick() {
  bump(WHATSAPP_KEY);
}

export function isPwaInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    ("standalone" in window.navigator &&
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true)
  );
}

export function isPwaPromptDismissed(): boolean {
  if (typeof window === "undefined") return true;
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  if (!Number.isFinite(dismissedAt)) return true;
  return Date.now() - dismissedAt < DISMISS_DAYS * 86_400_000;
}

export function dismissPwaPrompt() {
  if (typeof window === "undefined") return;
  localStorage.setItem(DISMISS_KEY, String(Date.now()));
}

export function getPwaEngagementSnapshot() {
  return {
    listingViews: getViewedListingIds().length,
    swipes: readCount(SWIPES_KEY),
    whatsappClicks: readCount(WHATSAPP_KEY),
    saves: getEngagementSaveCount(),
    visits: getVisitCount(),
  };
}

/** Behavior-triggered — never on first visit. */
export function shouldShowPwaInstallPrompt(): boolean {
  if (typeof window === "undefined") return false;
  if (isPwaInstalled()) return false;
  if (isPwaPromptDismissed()) return false;

  const { listingViews, swipes, whatsappClicks, saves, visits } =
    getPwaEngagementSnapshot();

  if (visits < 2 && listingViews < 2) return false;

  return (
    listingViews >= 5 ||
    swipes >= 2 ||
    visits >= 2 ||
    whatsappClicks >= 1 ||
    saves >= 1
  );
}
