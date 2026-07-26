/**
 * MetadataResolver — the single pure-compute entry point the UI layer calls.
 * It has no knowledge of vehicles or properties; it only reads manifests.
 */
import type {
  CategoryManifest,
  FieldOption,
  ListingFieldDef,
  ListingValues,
  PhotoChecklistStatus,
  ValidationRuleEvaluators,
  VisibilityRuleEvaluators,
} from "./types";
import type { CatalogMap } from "./catalogs/types";
import { filterVisibleFields } from "./visibility";
import { getOptionsForField } from "./dependency";
import { getSuggestions, type InferProviders } from "./suggestion";
import { applyAutofill, type AutofillPatch } from "./autofill";
import { photoChecklistStatus } from "./photo";

export type ResolverContext = {
  visibilityEvaluators?: VisibilityRuleEvaluators;
  validationEvaluators?: ValidationRuleEvaluators;
  inferProviders?: InferProviders;
  titleTouched?: boolean;
  subtitleTouched?: boolean;
  photoCount?: number;
};

export type ResolvedListingState = {
  visibleFields: ListingFieldDef[];
  stepFields: Record<string, ListingFieldDef[]>;
  optionsByField: Record<string, FieldOption[]>;
  suggestionsByField: Record<string, FieldOption[]>;
  autofillPatch: AutofillPatch;
  photoStatus: PhotoChecklistStatus;
};

export const MetadataResolver = {
  compute(
    manifest: CategoryManifest,
    values: ListingValues,
    catalogs: CatalogMap,
    ctx: ResolverContext = {}
  ): ResolvedListingState {
    const visibilityEvaluators = ctx.visibilityEvaluators ?? {};

    const visibleFields = filterVisibleFields(manifest.fields, values, visibilityEvaluators);
    const visibleIds = new Set(visibleFields.map((f) => f.id));

    const stepFields: Record<string, ListingFieldDef[]> = {};
    for (const step of manifest.steps) {
      const idsForStep =
        step.fieldIds ?? step.sections?.flatMap((section) => section.fieldIds) ?? [];
      stepFields[step.id] = idsForStep
        .filter((id) => visibleIds.has(id))
        .map((id) => manifest.fields.find((f) => f.id === id))
        .filter((f): f is ListingFieldDef => Boolean(f));
    }

    const optionsByField: Record<string, FieldOption[]> = {};
    const suggestionsByField: Record<string, FieldOption[]> = {};
    for (const field of visibleFields) {
      optionsByField[field.id] = getOptionsForField(field, values, catalogs);
      suggestionsByField[field.id] = getSuggestions(field, values, catalogs, ctx.inferProviders);
    }

    const autofillPatch = applyAutofill(manifest, values, {
      titleTouched: ctx.titleTouched,
      subtitleTouched: ctx.subtitleTouched,
    });

    const photoStatus = photoChecklistStatus(manifest.photo, ctx.photoCount ?? 0);

    return { visibleFields, stepFields, optionsByField, suggestionsByField, autofillPatch, photoStatus };
  },
};
