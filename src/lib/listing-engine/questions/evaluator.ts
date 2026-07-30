import type { DependencyCondition, QuestionFieldConfig } from "../types";

/**
 * Evaluates whether a question field should be visible based on smart dependencies.
 */
export function isFieldVisible(
  field: QuestionFieldConfig,
  formData: Record<string, unknown>
): boolean {
  if (!field.dependencies || field.dependencies.length === 0) {
    return true;
  }

  return field.dependencies.every((cond) => evaluateCondition(cond, formData));
}

function evaluateCondition(
  cond: DependencyCondition,
  formData: Record<string, unknown>
): boolean {
  const actualValue = formData[cond.field];

  switch (cond.operator) {
    case "equals":
      return actualValue === cond.value;

    case "not_equals":
      return actualValue !== cond.value;

    case "contains":
      if (Array.isArray(actualValue)) {
        return actualValue.includes(cond.value);
      }
      if (typeof actualValue === "string") {
        return actualValue.includes(String(cond.value));
      }
      return false;

    case "in":
      if (Array.isArray(cond.value)) {
        return cond.value.includes(actualValue);
      }
      return false;

    case "truthy":
      return Boolean(actualValue);

    case "falsy":
      return !Boolean(actualValue);

    default:
      return true;
  }
}
