import type {
  CategoryManifest,
  ListingFieldDef,
  ListingValues,
  PhotoChecklistStatus,
} from "./types";
import { validateValues } from "./validation";
import {
  NAMED_VALIDATION_RULES,
  NAMED_VISIBILITY_RULES,
} from "./rules/registry";
import {
  getManifestDetailsStepIds,
  getManifestDetailsTitle,
} from "./category-availability";
import { fieldJumpTarget } from "./review-summary";
import type { WizardStageId } from "./wizard-progress";

export type WizardNextAction = {
  kind: "ready" | "task";
  message: string;
  primaryLabel: string;
  sectionIndex: number;
  fieldId?: string;
  stageId?: WizardStageId;
};

export type WizardBlocker = {
  message: string;
  fieldId?: string;
  sectionIndex: number;
  required: boolean;
};

function isFilled(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.length > 0;
  return false;
}

function fieldsInOrder(
  stepFields: Record<string, ListingFieldDef[]>,
  stepIds: string[],
): ListingFieldDef[] {
  const out: ListingFieldDef[] = [];
  const seen = new Set<string>();
  for (const stepId of stepIds) {
    for (const field of stepFields[stepId] ?? []) {
      if (seen.has(field.id)) continue;
      seen.add(field.id);
      out.push(field);
    }
  }
  return out;
}

function firstIncompleteField(
  fields: ListingFieldDef[],
  values: ListingValues,
  errors: Record<string, string>,
): ListingFieldDef | null {
  for (const field of fields) {
    if (errors[field.id]) return field;
    if (field.required && !isFilled(values[field.id])) return field;
  }
  return null;
}

function guidanceMessage(field: ListingFieldDef): string {
  if (field.required) {
    return `${field.label} required`;
  }
  return field.label;
}

function photoGuidance(photoStatus: PhotoChecklistStatus): WizardNextAction {
  if (photoStatus.overMax) {
    return {
      kind: "task",
      message: `Remove extra photos — maximum ${photoStatus.max} allowed.`,
      primaryLabel: "Manage photos",
      sectionIndex: 1,
      stageId: "photos_price",
    };
  }
  const remaining = photoStatus.remainingToMin;
  return {
    kind: "task",
    message:
      remaining > 0
        ? `${remaining} more photo${remaining === 1 ? "" : "s"} needed`
        : "Photos required",
    primaryLabel: "Add photos",
    sectionIndex: 1,
    stageId: "photos_price",
  };
}

/** Next seller-facing action from validated manifest state (all categories). */
export function resolveListingWizardNextAction(input: {
  manifest: CategoryManifest;
  values: ListingValues;
  stepFields: Record<string, ListingFieldDef[]>;
  photoStatus: PhotoChecklistStatus;
}): WizardNextAction {
  const { manifest, values, stepFields, photoStatus } = input;
  const validation = validateValues(manifest, values, {
    visibilityEvaluators: NAMED_VISIBILITY_RULES,
    validationEvaluators: NAMED_VALIDATION_RULES,
  });

  const detailsStepIds = getManifestDetailsStepIds(manifest);
  const detailsFields = fieldsInOrder(stepFields, detailsStepIds);
  const detailsGap = firstIncompleteField(
    detailsFields,
    values,
    validation.errors,
  );
  if (detailsGap) {
    const target = fieldJumpTarget(detailsGap.id, manifest);
    return {
      kind: "task",
      message: guidanceMessage(detailsGap),
      primaryLabel: `Add ${detailsGap.label.toLowerCase()}`,
      sectionIndex: target.sectionIndex,
      fieldId: detailsGap.id,
      stageId: "details",
    };
  }

  if (!photoStatus.ok) {
    return photoGuidance(photoStatus);
  }

  const pricingFields = fieldsInOrder(stepFields, ["pricing"]);
  const pricingGap = firstIncompleteField(
    pricingFields,
    values,
    validation.errors,
  );
  if (pricingGap) {
    const target = fieldJumpTarget(pricingGap.id, manifest);
    return {
      kind: "task",
      message: guidanceMessage(pricingGap),
      primaryLabel:
        pricingGap.id === "price" ? "Set price" : `Add ${pricingGap.label.toLowerCase()}`,
      sectionIndex: target.sectionIndex,
      fieldId: pricingGap.id,
      stageId: "photos_price",
    };
  }

  const locationFields = fieldsInOrder(stepFields, ["location"]);
  const locationGap = firstIncompleteField(
    locationFields,
    values,
    validation.errors,
  );
  if (locationGap) {
    const target = fieldJumpTarget(locationGap.id, manifest);
    return {
      kind: "task",
      message: guidanceMessage(locationGap),
      primaryLabel:
        locationGap.id === "state"
          ? "Choose state"
          : locationGap.id === "city"
            ? "Choose city"
            : `Add ${locationGap.label.toLowerCase()}`,
      sectionIndex: target.sectionIndex,
      fieldId: locationGap.id,
      stageId: "location_review",
    };
  }

  if (!validation.ok) {
    const firstErrorField = Object.keys(validation.errors)[0];
    if (firstErrorField) {
      const field = manifest.fields.find((f) => f.id === firstErrorField);
      const target = fieldJumpTarget(firstErrorField, manifest);
      return {
        kind: "task",
        message:
          validation.errors[firstErrorField] ??
          "Fix the highlighted field to continue.",
        primaryLabel: field ? `Fix ${field.label.toLowerCase()}` : "Fix issue",
        sectionIndex: target.sectionIndex,
        fieldId: firstErrorField,
      };
    }
  }

  return {
    kind: "ready",
    message: "Ready for review",
    primaryLabel: "Review listing",
    sectionIndex: 2,
    stageId: "location_review",
  };
}

/** Required publication blockers with edit targets for review screen. */
export function listListingWizardBlockers(input: {
  manifest: CategoryManifest;
  values: ListingValues;
  stepFields: Record<string, ListingFieldDef[]>;
  photoStatus: PhotoChecklistStatus;
}): WizardBlocker[] {
  const { manifest, values, stepFields, photoStatus } = input;
  const validation = validateValues(manifest, values, {
    visibilityEvaluators: NAMED_VISIBILITY_RULES,
    validationEvaluators: NAMED_VALIDATION_RULES,
  });

  const blockers: WizardBlocker[] = [];
  const seen = new Set<string>();

  function pushField(field: ListingFieldDef) {
    const msg =
      validation.errors[field.id] ??
      (field.required && !isFilled(values[field.id])
        ? `${field.label} is required.`
        : null);
    if (!msg || seen.has(msg)) return;
    seen.add(msg);
    const target = fieldJumpTarget(field.id, manifest);
    blockers.push({
      message: msg,
      fieldId: field.id,
      sectionIndex: target.sectionIndex,
      required: true,
    });
  }

  const detailsStepIds = getManifestDetailsStepIds(manifest);
  for (const field of fieldsInOrder(stepFields, detailsStepIds)) {
    if (field.required || validation.errors[field.id]) pushField(field);
  }

  if (!photoStatus.ok) {
    if (photoStatus.remainingToMin > 0) {
      const msg = `Add at least ${photoStatus.min} listing photo${photoStatus.min === 1 ? "" : "s"}.`;
      if (!seen.has(msg)) {
        seen.add(msg);
        blockers.push({
          message: msg,
          sectionIndex: 1,
          required: true,
        });
      }
    }
    if (photoStatus.overMax) {
      const msg = `Remove extra photos (max ${photoStatus.max}).`;
      if (!seen.has(msg)) {
        seen.add(msg);
        blockers.push({ message: msg, sectionIndex: 1, required: true });
      }
    }
  }

  for (const field of fieldsInOrder(stepFields, ["pricing", "location"])) {
    if (field.required || validation.errors[field.id]) pushField(field);
  }

  for (const [fieldId, msg] of Object.entries(validation.errors)) {
    if (!msg || seen.has(msg)) continue;
    if (blockers.some((b) => b.fieldId === fieldId)) continue;
    seen.add(msg);
    const target = fieldJumpTarget(fieldId, manifest);
    blockers.push({
      message: msg,
      fieldId,
      sectionIndex: target.sectionIndex,
      required: true,
    });
  }

  return blockers;
}

export function manifestDetailsHeading(manifest: CategoryManifest): string {
  return getManifestDetailsTitle(manifest);
}
