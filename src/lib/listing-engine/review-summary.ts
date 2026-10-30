import type { CategoryManifest, ListingFieldDef, ListingValues } from "./types";

export type ReviewSummaryRow = {
  label: string;
  value: string;
  fieldId?: string;
  sectionIndex: 0 | 1 | 2;
};

function formatValue(field: ListingFieldDef, raw: unknown): string {
  if (raw === undefined || raw === null || raw === "") return "";
  if (field.input === "boolean") {
    return raw === true || raw === "on" || raw === "true" ? "Yes" : "No";
  }
  if (Array.isArray(raw)) return raw.join(", ");
  if (field.input === "currency" || field.id === "price") {
    const n = Number(raw);
    if (Number.isFinite(n)) return `₦${n.toLocaleString("en-NG")}`;
  }
  return String(raw).trim();
}

function sectionForField(fieldId: string, manifest: CategoryManifest): 0 | 1 | 2 {
  for (const step of manifest.steps) {
    if (step.id === "pricing" && step.fieldIds?.includes(fieldId)) return 1;
    if (step.id === "location" && step.fieldIds?.includes(fieldId)) return 2;
    if (
      step.id !== "pricing" &&
      step.id !== "location" &&
      step.id !== "photos" &&
      step.id !== "review" &&
      step.fieldIds?.includes(fieldId)
    ) {
      return 0;
    }
  }
  const field = manifest.fields.find((f) => f.id === fieldId);
  if (field?.input === "currency" || fieldId === "title" || fieldId === "description") {
    return 1;
  }
  if (fieldId === "state" || fieldId === "city" || fieldId === "area") return 2;
  return 0;
}

const REVIEW_FIELD_ORDER: Record<string, string[]> = {
  property: [
    "listing_type",
    "property_type",
    "bedrooms",
    "bathrooms",
    "title",
    "price",
    "payment_period",
    "state",
    "city",
    "area",
  ],
  vehicle: [
    "auto_category",
    "make",
    "model",
    "year",
    "vehicle_condition",
    "title",
    "price",
    "state",
    "city",
  ],
  electronics: [
    "auto_category",
    "brand",
    "model",
    "condition",
    "warranty_status",
    "warranty_note",
    "title",
    "price",
    "state",
    "city",
  ],
};

export function buildListingReviewSummary(
  manifest: CategoryManifest,
  values: ListingValues,
  visibleFieldIds: Set<string>,
): ReviewSummaryRow[] {
  const order = REVIEW_FIELD_ORDER[manifest.id] ?? [];
  const fieldsById = new Map(manifest.fields.map((f) => [f.id, f]));
  const rows: ReviewSummaryRow[] = [];
  const seen = new Set<string>();

  function pushField(fieldId: string) {
    if (seen.has(fieldId) || !visibleFieldIds.has(fieldId)) return;
    const field = fieldsById.get(fieldId);
    if (!field) return;
    const value = formatValue(field, values[fieldId]);
    if (!value) return;
    seen.add(fieldId);
    rows.push({
      label: field.label,
      value,
      fieldId,
      sectionIndex: sectionForField(fieldId, manifest),
    });
  }

  for (const id of order) pushField(id);
  for (const field of manifest.fields) {
    if (!order.includes(field.id)) pushField(field.id);
  }

  return rows;
}

export function fieldJumpTarget(
  fieldId: string,
  manifest: CategoryManifest,
): { sectionIndex: number; stepId?: string } {
  for (const step of manifest.steps) {
    if (step.fieldIds?.includes(fieldId)) {
      if (step.id === "pricing" || step.id === "photos") return { sectionIndex: 1, stepId: step.id };
      if (step.id === "location") return { sectionIndex: 2, stepId: step.id };
      return { sectionIndex: 0, stepId: step.id };
    }
  }
  return { sectionIndex: sectionForField(fieldId, manifest) };
}
