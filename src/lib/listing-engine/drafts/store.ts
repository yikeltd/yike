import type { DraftState, FlowState } from "../types";
import { getDraftStorageAdapter } from "./storage-adapter";

export function saveDraftLocal(
  categoryId: string,
  currentState: FlowState,
  stepIndex: number,
  formData: Record<string, unknown>
): DraftState | Promise<DraftState> {
  const adapter = getDraftStorageAdapter();
  return adapter.saveDraft(categoryId, currentState, stepIndex, formData);
}

export function loadDraftLocal(
  categoryId: string
): DraftState | Promise<DraftState | null> | null {
  const adapter = getDraftStorageAdapter();
  return adapter.loadDraft(categoryId);
}

export function clearDraftLocal(categoryId: string): void | Promise<void> {
  const adapter = getDraftStorageAdapter();
  return adapter.clearDraft(categoryId);
}
