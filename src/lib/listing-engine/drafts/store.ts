import type { DraftState, FlowState } from "../types";

const DRAFT_STORAGE_PREFIX = "yike_listing_draft_v2_";

export function getDraftKey(categoryId: string): string {
  return `${DRAFT_STORAGE_PREFIX}${categoryId}`;
}

export function saveDraftLocal(
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
      localStorage.setItem(getDraftKey(categoryId), JSON.stringify(draft));
    }
  } catch (e) {
    console.warn("Failed to write draft to localStorage", e);
  }

  return draft;
}

export function loadDraftLocal(categoryId: string): DraftState | null {
  try {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(getDraftKey(categoryId));
      if (raw) {
        return JSON.parse(raw) as DraftState;
      }
    }
  } catch (e) {
    console.warn("Failed to load draft from localStorage", e);
  }

  return null;
}

export function clearDraftLocal(categoryId: string): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem(getDraftKey(categoryId));
    }
  } catch (e) {
    console.warn("Failed to clear draft from localStorage", e);
  }
}
