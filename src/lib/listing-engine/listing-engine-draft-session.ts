/**
 * Per-browser-tab draft session — sessionStorage isolates concurrent new-listing wizards.
 */

const SESSION_KEY_PREFIX = "yike_engine_listing_draft_session:";

export function listingDraftSessionStorageKey(
  agentId: string,
  categoryId: string,
): string {
  return `${SESSION_KEY_PREFIX}${categoryId}:${agentId}`;
}

export function getOrCreateListingDraftSessionId(
  agentId: string,
  categoryId: string,
): string {
  if (typeof window === "undefined") return "server";
  const key = listingDraftSessionStorageKey(agentId, categoryId);
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const next =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `draft_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  window.sessionStorage.setItem(key, next);
  return next;
}

export function resetListingDraftSessionId(agentId: string, categoryId: string): string {
  if (typeof window === "undefined") return "server";
  const key = listingDraftSessionStorageKey(agentId, categoryId);
  const next =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `draft_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  window.sessionStorage.setItem(key, next);
  return next;
}

export function clearListingDraftSessionId(agentId: string, categoryId: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(listingDraftSessionStorageKey(agentId, categoryId));
}
