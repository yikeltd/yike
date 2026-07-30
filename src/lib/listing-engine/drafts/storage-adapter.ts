import type { DraftState, FlowState } from "../types";

export interface DraftStorageAdapter {
  name: string;
  saveDraft(
    categoryId: string,
    currentState: FlowState,
    stepIndex: number,
    formData: Record<string, unknown>
  ): Promise<DraftState> | DraftState;

  loadDraft(categoryId: string): Promise<DraftState | null> | DraftState | null;

  clearDraft(categoryId: string): Promise<void> | void;
}

const STORAGE_PREFIX = "yike_engine_draft_v3_";

export class LocalStorageDraftAdapter implements DraftStorageAdapter {
  name = "LocalStorage";

  saveDraft(
    categoryId: string,
    currentState: FlowState,
    stepIndex: number,
    formData: Record<string, unknown>
  ): DraftState {
    const draft: DraftState = {
      categoryId,
      currentState,
      stepIndex,
      data: formData,
      lastSavedAt: new Date().toISOString(),
    };

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(`${STORAGE_PREFIX}${categoryId}`, JSON.stringify(draft));
      }
    } catch (e) {
      console.warn("[LocalStorageDraftAdapter] Save error:", e);
    }

    return draft;
  }

  loadDraft(categoryId: string): DraftState | null {
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem(`${STORAGE_PREFIX}${categoryId}`);
        if (raw) return JSON.parse(raw) as DraftState;
      }
    } catch (e) {
      console.warn("[LocalStorageDraftAdapter] Load error:", e);
    }
    return null;
  }

  clearDraft(categoryId: string): void {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(`${STORAGE_PREFIX}${categoryId}`);
      }
    } catch (e) {
      console.warn("[LocalStorageDraftAdapter] Clear error:", e);
    }
  }
}

export class MemoryDraftAdapter implements DraftStorageAdapter {
  name = "Memory";
  private memoryStore = new Map<string, DraftState>();

  saveDraft(
    categoryId: string,
    currentState: FlowState,
    stepIndex: number,
    formData: Record<string, unknown>
  ): DraftState {
    const draft: DraftState = {
      categoryId,
      currentState,
      stepIndex,
      data: formData,
      lastSavedAt: new Date().toISOString(),
    };
    this.memoryStore.set(categoryId, draft);
    return draft;
  }

  loadDraft(categoryId: string): DraftState | null {
    return this.memoryStore.get(categoryId) ?? null;
  }

  clearDraft(categoryId: string): void {
    this.memoryStore.delete(categoryId);
  }
}

// Active storage adapter (defaults to LocalStorage)
let activeDraftAdapter: DraftStorageAdapter = new LocalStorageDraftAdapter();

export function setDraftStorageAdapter(adapter: DraftStorageAdapter): void {
  activeDraftAdapter = adapter;
}

export function getDraftStorageAdapter(): DraftStorageAdapter {
  return activeDraftAdapter;
}
