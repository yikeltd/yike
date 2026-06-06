/**
 * Web push foundation — subscribe/send wired in Phase 2.
 * MVP: no permission prompts until retention rules exist.
 */

export type PushTopic =
  | "new_listings_nearby"
  | "saved_search_match"
  | "price_drop"
  | "listing_update";

export function isWebPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** Placeholder — returns false until VAPID keys + user prefs ship. */
export async function subscribeToPush(_topics: PushTopic[]): Promise<boolean> {
  return false;
}

export async function unsubscribeFromPush(): Promise<void> {
  /* Phase 2 */
}
