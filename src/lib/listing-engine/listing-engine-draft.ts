/**
 * Unified local draft persistence for ListingEngine (all manifest categories).
 * Scoped by agent + category + per-tab draft session.
 */

const KEY_PREFIX = "yike_engine_listing_draft_v2:";
const LEGACY_KEY_PREFIX = "yike_engine_listing_draft_v2:";
const CONSUMED_PREFIX = "yike_engine_listing_draft_consumed_v2:";
const MAX_AGE_MS = 90 * 86_400_000;

export type EngineListingDraft = {
  version: 2;
  agentId: string;
  categoryId: string;
  draftSessionId: string;
  savedAt: number;
  revision: number;
  activeSection: number;
  values: Record<string, unknown>;
  media_urls: string[];
};

export type DraftSaveResult =
  | { ok: true; revision: number }
  | { ok: false; reason: "quota_exceeded" | "storage_unavailable" | "blocked_by_remote" };

export type DraftConsumedMarker = {
  at: number;
  reason: "published" | "discarded";
};

export function engineListingDraftKey(
  agentId: string,
  categoryId: string,
  draftSessionId?: string,
): string {
  if (draftSessionId) {
    return `${KEY_PREFIX}${categoryId}:${agentId}:${draftSessionId}`;
  }
  return `${LEGACY_KEY_PREFIX}${categoryId}:${agentId}`;
}

export function engineListingDraftConsumedKey(
  agentId: string,
  categoryId: string,
  draftSessionId?: string,
): string {
  if (draftSessionId) {
    return `${CONSUMED_PREFIX}${categoryId}:${agentId}:${draftSessionId}`;
  }
  return `${CONSUMED_PREFIX}${categoryId}:${agentId}`;
}

function draftStorage(): Storage | null {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  const g = globalThis as { localStorage?: Storage };
  if (g.localStorage) return g.localStorage;
  return null;
}

function readConsumedMarker(
  agentId: string,
  categoryId: string,
  draftSessionId?: string,
): DraftConsumedMarker | null {
  const storage = draftStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(
      engineListingDraftConsumedKey(agentId, categoryId, draftSessionId),
    );
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftConsumedMarker;
    if (typeof parsed.at !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function markEngineListingDraftConsumed(
  agentId: string,
  categoryId: string,
  reason: DraftConsumedMarker["reason"],
  draftSessionId?: string,
): void {
  const storage = draftStorage();
  if (!storage) return;
  try {
    storage.setItem(
      engineListingDraftConsumedKey(agentId, categoryId, draftSessionId),
      JSON.stringify({ at: Date.now(), reason } satisfies DraftConsumedMarker),
    );
  } catch {
    /* ignore */
  }
}

function draftSupersededByConsumption(
  draft: EngineListingDraft,
  agentId: string,
  categoryId: string,
): boolean {
  const consumed = readConsumedMarker(agentId, categoryId, draft.draftSessionId);
  if (!consumed) return false;
  return draft.savedAt <= consumed.at;
}

function normalizeDraft(raw: EngineListingDraft): EngineListingDraft {
  return {
    ...raw,
    draftSessionId: raw.draftSessionId ?? "legacy",
    revision: typeof raw.revision === "number" ? raw.revision : 0,
  };
}

/** Prefer per-tab session draft; one-time migrate from legacy shared key. */
export function loadEngineListingDraftWithLegacyFallback(
  agentId: string,
  categoryId: string,
  draftSessionId: string,
): EngineListingDraft | null {
  const sessionDraft = loadEngineListingDraft(agentId, categoryId, draftSessionId);
  if (sessionDraft) return sessionDraft;
  const legacy = loadEngineListingDraft(agentId, categoryId);
  if (!legacy) return null;
  saveEngineListingDraft({
    version: 2,
    agentId,
    categoryId,
    draftSessionId,
    activeSection: legacy.activeSection,
    values: legacy.values,
    media_urls: legacy.media_urls,
    revision: legacy.revision,
  });
  clearEngineListingDraft(agentId, categoryId);
  return loadEngineListingDraft(agentId, categoryId, draftSessionId);
}

export function loadEngineListingDraft(
  agentId: string,
  categoryId: string,
  draftSessionId?: string,
): EngineListingDraft | null {
  const storage = draftStorage();
  if (!storage) return null;
  try {
    const keysToTry = draftSessionId
      ? [engineListingDraftKey(agentId, categoryId, draftSessionId)]
      : [
          engineListingDraftKey(agentId, categoryId),
          ...(draftSessionId ? [engineListingDraftKey(agentId, categoryId, draftSessionId)] : []),
        ];

    for (const key of keysToTry) {
      const raw = storage.getItem(key);
      if (!raw) continue;
      const draft = normalizeDraft(JSON.parse(raw) as EngineListingDraft);
      if (draft.version !== 2 || draft.agentId !== agentId) continue;
      if (Date.now() - draft.savedAt > MAX_AGE_MS) {
        storage.removeItem(key);
        continue;
      }
      if (draftSupersededByConsumption(draft, agentId, categoryId)) {
        storage.removeItem(key);
        continue;
      }
      return draft;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveEngineListingDraft(
  draft: Omit<EngineListingDraft, "revision" | "savedAt"> & {
    revision?: number;
    savedAt?: number;
  },
  opts?: { baseRevision?: number },
): DraftSaveResult {
  const storage = draftStorage();
  if (!storage) return { ok: false, reason: "storage_unavailable" };

  const key = engineListingDraftKey(
    draft.agentId,
    draft.categoryId,
    draft.draftSessionId,
  );
  let nextRevision = draft.revision ?? 0;
  try {
    const existingRaw = storage.getItem(key);
    if (existingRaw) {
      const existing = normalizeDraft(JSON.parse(existingRaw) as EngineListingDraft);
      if (existing.draftSessionId !== draft.draftSessionId) {
        return { ok: false, reason: "blocked_by_remote" };
      }
      if (
        opts?.baseRevision != null &&
        existing.revision > opts.baseRevision
      ) {
        return { ok: false, reason: "blocked_by_remote" };
      }
      nextRevision = Math.max(existing.revision, nextRevision) + 1;
    } else {
      nextRevision = nextRevision + 1;
    }

    const payload: EngineListingDraft = {
      version: 2,
      agentId: draft.agentId,
      categoryId: draft.categoryId,
      draftSessionId: draft.draftSessionId,
      savedAt: Date.now(),
      revision: nextRevision,
      activeSection: draft.activeSection,
      values: draft.values,
      media_urls: draft.media_urls,
    };
    storage.setItem(key, JSON.stringify(payload));
    storage.removeItem(
      engineListingDraftConsumedKey(
        draft.agentId,
        draft.categoryId,
        draft.draftSessionId,
      ),
    );
    return { ok: true, revision: nextRevision };
  } catch (err) {
    const name = err instanceof DOMException ? err.name : "";
    if (name === "QuotaExceededError") {
      return { ok: false, reason: "quota_exceeded" };
    }
    return { ok: false, reason: "storage_unavailable" };
  }
}

export function clearEngineListingDraft(
  agentId: string,
  categoryId: string,
  draftSessionId?: string,
): void {
  const storage = draftStorage();
  if (!storage) return;
  if (draftSessionId) {
    storage.removeItem(engineListingDraftKey(agentId, categoryId, draftSessionId));
    return;
  }
  storage.removeItem(engineListingDraftKey(agentId, categoryId));
}

export function discardEngineListingDraft(
  agentId: string,
  categoryId: string,
  draftSessionId?: string,
): void {
  clearEngineListingDraft(agentId, categoryId, draftSessionId);
  markEngineListingDraftConsumed(agentId, categoryId, "discarded", draftSessionId);
}

export function migrateLegacyVehicleDraft(
  agentId: string,
  draftSessionId: string,
): EngineListingDraft | null {
  const storage = draftStorage();
  if (!storage) return null;
  try {
    const legacyKey = `yike_vehicle_draft_v1:${agentId}`;
    const raw = storage.getItem(legacyKey);
    if (!raw) return null;
    const legacy = JSON.parse(raw) as { savedAt?: number; data?: Record<string, unknown> };
    const data = legacy.data ?? {};
    const values: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      if (k === "media_urls") continue;
      if (
        typeof v === "string" ||
        typeof v === "number" ||
        typeof v === "boolean" ||
        Array.isArray(v)
      ) {
        values[k] = v;
      }
    }
    const media = Array.isArray(data.media_urls)
      ? (data.media_urls as string[])
      : [];
    saveEngineListingDraft({
      version: 2,
      agentId,
      categoryId: "vehicle",
      draftSessionId,
      activeSection: 0,
      values,
      media_urls: media,
    });
    storage.removeItem(legacyKey);
    return loadEngineListingDraft(agentId, "vehicle", draftSessionId);
  } catch {
    return null;
  }
}

export function parseEngineListingDraftFromStorageEvent(
  key: string,
  newValue: string | null,
  agentId: string,
  categoryId: string,
  draftSessionId: string,
): EngineListingDraft | null {
  if (key !== engineListingDraftKey(agentId, categoryId, draftSessionId) || !newValue) {
    return null;
  }
  try {
    const draft = normalizeDraft(JSON.parse(newValue) as EngineListingDraft);
    if (
      draft.agentId !== agentId ||
      draft.categoryId !== categoryId ||
      draft.draftSessionId !== draftSessionId
    ) {
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}
