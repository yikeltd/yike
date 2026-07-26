/**
 * Visibility engine — pure metadata evaluation, no category knowledge.
 */
import type {
  ListingFieldDef,
  ListingValues,
  VisibilityRule,
  VisibilityRuleEvaluators,
} from "./types";

function includesValue(
  haystack: string | number | boolean | Array<string | number>,
  needle: unknown
): boolean {
  if (Array.isArray(haystack)) {
    return haystack.some((v) => String(v) === String(needle));
  }
  return String(haystack) === String(needle);
}

export function evaluateVisibility(
  rule: VisibilityRule | undefined,
  values: ListingValues,
  ruleEvaluators: VisibilityRuleEvaluators = {}
): boolean {
  if (!rule) return true;

  switch (rule.op) {
    case "always":
      return true;
    case "equals":
      return includesValue(rule.value, values[rule.field]);
    case "notEquals":
      return !includesValue(rule.value, values[rule.field]);
    case "truthy":
      return Boolean(values[rule.field]);
    case "falsy":
      return !values[rule.field];
    case "and":
      return rule.rules.every((r) => evaluateVisibility(r, values, ruleEvaluators));
    case "or":
      return rule.rules.some((r) => evaluateVisibility(r, values, ruleEvaluators));
    case "not":
      return !evaluateVisibility(rule.rule, values, ruleEvaluators);
    case "rule": {
      const evaluator = ruleEvaluators[rule.id];
      if (!evaluator) {
        throw new Error(`listing-engine: unknown visibility rule id "${rule.id}"`);
      }
      return evaluator(values);
    }
    default:
      return true;
  }
}

export function filterVisibleFields(
  fields: ListingFieldDef[],
  values: ListingValues,
  ruleEvaluators: VisibilityRuleEvaluators = {}
): ListingFieldDef[] {
  return fields.filter((field) => evaluateVisibility(field.visible, values, ruleEvaluators));
}

export function isFieldVisible(
  field: ListingFieldDef,
  values: ListingValues,
  ruleEvaluators: VisibilityRuleEvaluators = {}
): boolean {
  return evaluateVisibility(field.visible, values, ruleEvaluators);
}
