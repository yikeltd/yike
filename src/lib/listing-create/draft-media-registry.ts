/**
 * Device-local tracking for media URLs tied to a draft session.
 * Does not delete Supabase storage objects — recovery/orphan awareness only.
 */

const REGISTRY_PREFIX = "yike_draft_media_registry:";

function registryKey(draftSessionId: string): string {
  return `${REGISTRY_PREFIX}${draftSessionId}`;
}

function readSet(draftSessionId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(registryKey(draftSessionId));
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr.filter(Boolean) : []);
  } catch {
    return new Set();
  }
}

function writeSet(draftSessionId: string, urls: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(registryKey(draftSessionId), JSON.stringify([...urls]));
  } catch {
    /* quota */
  }
}

export function trackDraftMediaUrl(draftSessionId: string, url: string): void {
  if (!url?.trim()) return;
  const set = readSet(draftSessionId);
  set.add(url.trim());
  writeSet(draftSessionId, set);
}

export function markDraftMediaCommitted(
  draftSessionId: string,
  publishedUrls: string[],
): void {
  const set = readSet(draftSessionId);
  for (const url of publishedUrls) {
    set.delete(url);
  }
  writeSet(draftSessionId, set);
}

/** URLs uploaded for this draft session but not in the active wizard photo list (likely orphaned). */
export function listOrphanDraftMediaUrls(
  draftSessionId: string,
  activeReadyUrls: string[],
): string[] {
  const active = new Set(activeReadyUrls.filter(Boolean));
  return [...readSet(draftSessionId)].filter((url) => !active.has(url));
}

export function clearDraftMediaRegistry(draftSessionId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(registryKey(draftSessionId));
}
