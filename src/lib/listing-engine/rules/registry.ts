/**
 * Named rule evaluators — referenced from metadata via `{ op: "rule", id }`
 * (visibility) or `{ type: "rule", id }` (validation). Category conditionals
 * are allowed to live here (behind a stable id) so that `visibility.ts` /
 * `validation.ts` stay category-agnostic and only resolve ids.
 */
import { isCommercialProperty, isLandProperty, showRoomFields } from "@/lib/listing-field-rules";
import type { ListingTypeValue } from "@/constants/listingTypes";
import type {
  ListingValues,
  ValidationRuleEvaluator,
  ValidationRuleEvaluators,
  VisibilityRuleEvaluator,
  VisibilityRuleEvaluators,
} from "../types";

function str(values: ListingValues, key: string): string {
  return String(values[key] ?? "");
}

export const NAMED_VISIBILITY_RULES: VisibilityRuleEvaluators = {
  "property.is_land": (values) => isLandProperty(str(values, "property_type")),
  "property.is_commercial": (values) => isCommercialProperty(str(values, "property_type")),
  "property.show_room_fields": (values) =>
    showRoomFields(
      str(values, "property_type"),
      (str(values, "listing_type") || "rent") as ListingTypeValue
    ),
};

export const NAMED_VALIDATION_RULES: ValidationRuleEvaluators = {};

export function registerVisibilityRule(id: string, evaluator: VisibilityRuleEvaluator): void {
  NAMED_VISIBILITY_RULES[id] = evaluator;
}

export function registerValidationRule(id: string, evaluator: ValidationRuleEvaluator): void {
  NAMED_VALIDATION_RULES[id] = evaluator;
}
