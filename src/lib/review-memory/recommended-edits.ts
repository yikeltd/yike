import type { ReviewRequestType } from "./constants";

export const RECOMMENDED_EDIT_OPTIONS: { type: ReviewRequestType; label: string }[] = [
  { type: "clearer_photos", label: "Photos" },
  { type: "fee_clarity", label: "Price & fees" },
  { type: "location_correction", label: "Location" },
  { type: "update", label: "Title or description" },
  { type: "title_document", label: "Documents" },
  { type: "explain", label: "Pricing or terms" },
];

export function buildRecommendedEditMessage(
  types: ReviewRequestType[],
  note?: string
): string {
  const labels = types.map(
    (t) => RECOMMENDED_EDIT_OPTIONS.find((o) => o.type === t)?.label ?? t
  );
  const trimmed = note?.trim();
  const base = `Please update: ${labels.join(", ")}.`;
  return trimmed ? `${base} ${trimmed}` : base;
}
