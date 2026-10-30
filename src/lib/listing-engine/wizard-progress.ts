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

export type WizardStageId = "details" | "photos_price" | "location_review";

export type WizardStageConfig = {
  id: WizardStageId;
  label: string;
  stepIds: string[];
};

export type WizardProgress = {
  stages: Array<{
    id: WizardStageId;
    label: string;
    complete: boolean;
    missing: string[];
  }>;
  completionPercent: number;
  canPublish: boolean;
  publishBlockers: string[];
  detailsTitle: string;
};

const PHOTOS_PRICE_STEP_IDS = ["pricing"];
const LOCATION_STEP_IDS = ["location"];

function isFilled(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.length > 0;
  return false;
}

function fieldsForSteps(
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

function stageMissingLabels(
  fields: ListingFieldDef[],
  values: ListingValues,
  errors: Record<string, string>,
): string[] {
  const missing: string[] = [];
  for (const field of fields) {
    if (errors[field.id]) {
      missing.push(errors[field.id]!);
      continue;
    }
    if (field.required && !isFilled(values[field.id])) {
      missing.push(`${field.label} is required.`);
    }
  }
  return missing;
}

export function getWizardStageConfigs(manifest: CategoryManifest): WizardStageConfig[] {
  const detailsStepIds = getManifestDetailsStepIds(manifest);
  return [
    { id: "details", label: "Item details", stepIds: detailsStepIds },
    { id: "photos_price", label: "Photos & price", stepIds: PHOTOS_PRICE_STEP_IDS },
    {
      id: "location_review",
      label: "Location & review",
      stepIds: LOCATION_STEP_IDS,
    },
  ];
}

export function computeListingWizardProgress(
  manifest: CategoryManifest,
  values: ListingValues,
  stepFields: Record<string, ListingFieldDef[]>,
  photoStatus: PhotoChecklistStatus,
): WizardProgress {
  const validation = validateValues(manifest, values, {
    visibilityEvaluators: NAMED_VISIBILITY_RULES,
    validationEvaluators: NAMED_VALIDATION_RULES,
  });

  const stages = getWizardStageConfigs(manifest).map((stage) => {
    const fields = fieldsForSteps(stepFields, stage.stepIds);
    let missing = stageMissingLabels(fields, values, validation.errors);

    if (stage.id === "photos_price") {
      if (!photoStatus.ok) {
        if (photoStatus.remainingToMin > 0) {
          missing.push(
            `Add at least ${photoStatus.min} photo${photoStatus.min === 1 ? "" : "s"} (${photoStatus.remainingToMin} more).`,
          );
        }
        if (photoStatus.overMax) {
          missing.push(`Maximum ${photoStatus.max} photos allowed.`);
        }
      }
    }

    return {
      id: stage.id,
      label: stage.label,
      complete: missing.length === 0,
      missing,
    };
  });

  const allVisibleFields = Object.values(stepFields).flat();
  const uniqueFields = new Map<string, ListingFieldDef>();
  for (const f of allVisibleFields) uniqueFields.set(f.id, f);

  let filled = 0;
  let total = 0;
  for (const field of uniqueFields.values()) {
    total += 1;
    if (isFilled(values[field.id])) filled += 1;
  }
  if (photoStatus.min > 0) {
    total += 1;
    if (photoStatus.count >= photoStatus.min) filled += 1;
  }

  const completionPercent =
    total > 0 ? Math.min(100, Math.round((filled / total) * 100)) : 0;

  const publishBlockers: string[] = [];
  const seenMessages = new Set<string>();
  for (const msg of Object.values(validation.errors)) {
    if (!msg || seenMessages.has(msg)) continue;
    seenMessages.add(msg);
    publishBlockers.push(msg);
  }
  if (!photoStatus.ok) {
    if (photoStatus.remainingToMin > 0) {
      const photoMsg = `Add at least ${photoStatus.min} listing photo${photoStatus.min === 1 ? "" : "s"}.`;
      if (!seenMessages.has(photoMsg)) {
        seenMessages.add(photoMsg);
        publishBlockers.push(photoMsg);
      }
    }
    if (photoStatus.overMax) {
      const maxMsg = `Remove extra photos (max ${photoStatus.max}).`;
      if (!seenMessages.has(maxMsg)) {
        seenMessages.add(maxMsg);
        publishBlockers.push(maxMsg);
      }
    }
  }

  const canPublish = validation.ok && photoStatus.ok;

  return {
    stages,
    completionPercent,
    canPublish,
    publishBlockers,
    detailsTitle: getManifestDetailsTitle(manifest),
  };
}
