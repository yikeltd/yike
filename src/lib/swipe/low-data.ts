/** Detect slow network / data saver for lighter swipe motion. */
export function isLowDataMode(): boolean {
  if (typeof window === "undefined") return false;

  const conn = (
    navigator as Navigator & {
      connection?: {
        saveData?: boolean;
        effectiveType?: string;
      };
    }
  ).connection;

  if (conn?.saveData) return true;
  const type = conn?.effectiveType ?? "";
  return type === "slow-2g" || type === "2g" || type === "3g";
}

export function motionEnabled(): boolean {
  if (typeof window === "undefined") return true;
  if (isLowDataMode()) return false;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Responsive image width for swipe cards. */
export function getSwipeImageWidth(): number {
  if (isLowDataMode()) return 480;
  return 720;
}

/** How many upcoming cards to warm-cache. */
export function getSwipePreloadCount(): number {
  return isLowDataMode() ? 1 : 2;
}
