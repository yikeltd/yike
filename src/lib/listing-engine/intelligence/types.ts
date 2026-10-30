import type { ListingCategoryId } from "../types";

export type SuggestionConfidence = "high" | "medium" | "low";

export type ParsedFieldSuggestion = {
  fieldId: string;
  value: unknown;
  confidence: SuggestionConfidence;
  /** Human-readable reason for UI chips (optional). */
  label?: string;
};

export type CategoryHint = {
  categoryId: ListingCategoryId;
  confidence: SuggestionConfidence;
};

export type ParseListingTextResult = {
  categoryHint?: CategoryHint;
  fields: ParsedFieldSuggestion[];
};
