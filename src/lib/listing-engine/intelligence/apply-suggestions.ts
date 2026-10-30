import type { ListingValues } from "../types";
import type { ParsedFieldSuggestion, SuggestionConfidence } from "./types";

export type InferenceApplyResult = {
  patch: Partial<ListingValues>;
  inferredFieldIds: string[];
  /** Medium/low suggestions keyed by field — not auto-applied. */
  pendingByField: Record<string, ParsedFieldSuggestion[]>;
};

function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

const AUTO_APPLY: Set<SuggestionConfidence> = new Set(["high"]);

/**
 * Apply only high-confidence suggestions to empty, non-user-confirmed fields.
 * Never overwrites seller-entered values.
 */
export function applyListingSuggestions(
  suggestions: ParsedFieldSuggestion[],
  values: ListingValues,
  confirmedFieldIds: ReadonlySet<string>,
): InferenceApplyResult {
  const patch: Partial<ListingValues> = {};
  const inferredFieldIds: string[] = [];
  const pendingByField: Record<string, ParsedFieldSuggestion[]> = {};

  for (const s of suggestions) {
    if (confirmedFieldIds.has(s.fieldId)) continue;

    if (!AUTO_APPLY.has(s.confidence)) {
      if (!pendingByField[s.fieldId]) pendingByField[s.fieldId] = [];
      pendingByField[s.fieldId]!.push(s);
      continue;
    }

    const current = values[s.fieldId];
    if (!isEmptyValue(current)) continue;

    patch[s.fieldId] = s.value;
    inferredFieldIds.push(s.fieldId);
  }

  return { patch, inferredFieldIds, pendingByField };
}
