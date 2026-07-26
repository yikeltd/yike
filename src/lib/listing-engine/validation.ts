/**
 * Validation engine — executes metadata validators against visible fields
 * only. No category conditionals; named rule ids are resolved via
 * `ValidationRuleEvaluators` passed in by the caller (see rules/registry.ts).
 */
import type {
  CategoryManifest,
  ListingFieldDef,
  ListingValues,
  ValidationResult,
  ValidationRule,
  ValidationRuleEvaluators,
  VisibilityRuleEvaluators,
} from "./types";
import { evaluateVisibility, filterVisibleFields } from "./visibility";

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function runRule(
  rule: ValidationRule,
  value: unknown,
  values: ListingValues,
  field: ListingFieldDef,
  visibilityEvaluators: VisibilityRuleEvaluators,
  validationEvaluators: ValidationRuleEvaluators
): string | null {
  switch (rule.type) {
    case "required":
      return isEmpty(value) ? `${field.label} is required.` : null;
    case "min": {
      const n = Number(value);
      return Number.isFinite(n) && n < rule.value ? `${field.label} must be at least ${rule.value}.` : null;
    }
    case "max": {
      const n = Number(value);
      return Number.isFinite(n) && n > rule.value ? `${field.label} must be at most ${rule.value}.` : null;
    }
    case "minLength": {
      const len = typeof value === "string" ? value.length : 0;
      return !isEmpty(value) && len < rule.value
        ? `${field.label} must be at least ${rule.value} characters.`
        : null;
    }
    case "maxLength": {
      const len = typeof value === "string" ? value.length : 0;
      return len > rule.value ? `${field.label} must be at most ${rule.value} characters.` : null;
    }
    case "pattern": {
      if (isEmpty(value)) return null;
      const regex = new RegExp(rule.value);
      return regex.test(String(value)) ? null : rule.message ?? `${field.label} is invalid.`;
    }
    case "integer": {
      if (isEmpty(value)) return null;
      return Number.isInteger(Number(value)) ? null : `${field.label} must be a whole number.`;
    }
    case "when": {
      const applies =
        rule.visible === undefined || evaluateVisibility(rule.visible, values, visibilityEvaluators);
      if (!applies) return null;
      for (const inner of rule.rules) {
        const err = runRule(inner, value, values, field, visibilityEvaluators, validationEvaluators);
        if (err) return err;
      }
      return null;
    }
    case "rule": {
      const evaluator = validationEvaluators[rule.id];
      if (!evaluator) {
        throw new Error(`listing-engine: unknown validation rule id "${rule.id}"`);
      }
      return evaluator(values, field);
    }
    default:
      return null;
  }
}

export function validateValues(
  manifest: CategoryManifest,
  values: ListingValues,
  opts: {
    visibilityEvaluators?: VisibilityRuleEvaluators;
    validationEvaluators?: ValidationRuleEvaluators;
  } = {}
): ValidationResult {
  const visibilityEvaluators = opts.visibilityEvaluators ?? {};
  const validationEvaluators = opts.validationEvaluators ?? {};
  const visibleFields = filterVisibleFields(manifest.fields, values, visibilityEvaluators);
  const errors: Record<string, string> = {};

  for (const field of visibleFields) {
    const value = values[field.id];
    const rules: ValidationRule[] = field.required
      ? [{ type: "required" }, ...(field.validation ?? [])]
      : field.validation ?? [];

    for (const rule of rules) {
      const message = runRule(rule, value, values, field, visibilityEvaluators, validationEvaluators);
      if (message) {
        errors[field.id] = message;
        break;
      }
    }
  }

  return { ok: Object.keys(errors).length === 0, errors };
}
