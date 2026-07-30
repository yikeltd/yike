import type { QuestionFieldConfig } from "../types";
import { isFieldVisible } from "../questions/evaluator";

export type FieldErrorMap = Record<string, string>;

/**
 * Validates a single field in real time.
 */
export function validateField(
  field: QuestionFieldConfig,
  value: unknown
): string | null {
  if (!field.validation || field.validation.length === 0) {
    return null;
  }

  for (const rule of field.validation) {
    switch (rule.type) {
      case "required":
        if (
          value === undefined ||
          value === null ||
          value === "" ||
          (Array.isArray(value) && value.length === 0)
        ) {
          return rule.message ?? "This field is required.";
        }
        break;

      case "min":
        if (typeof value === "number" && value < Number(rule.value)) {
          return rule.message ?? `Must be at least ${rule.value}.`;
        }
        if (typeof value === "string" && Number(value) < Number(rule.value)) {
          return rule.message ?? `Must be at least ${rule.value}.`;
        }
        break;

      case "max":
        if (typeof value === "number" && value > Number(rule.value)) {
          return rule.message ?? `Must be at most ${rule.value}.`;
        }
        if (typeof value === "string" && Number(value) > Number(rule.value)) {
          return rule.message ?? `Must be at most ${rule.value}.`;
        }
        break;

      case "minLength":
        if (typeof value === "string" && value.length < Number(rule.value)) {
          return rule.message ?? `Must be at least ${rule.value} characters.`;
        }
        break;

      case "maxLength":
        if (typeof value === "string" && value.length > Number(rule.value)) {
          return rule.message ?? `Must be at most ${rule.value} characters.`;
        }
        break;

      case "minPhotos":
        if (!Array.isArray(value) || value.length < Number(rule.value)) {
          return rule.message ?? `Please upload at least ${rule.value} photos.`;
        }
        break;

      case "pattern":
        if (
          typeof value === "string" &&
          rule.value instanceof RegExp &&
          !rule.value.test(value)
        ) {
          return rule.message ?? "Invalid format.";
        }
        break;
    }
  }

  return null;
}

/**
 * Validates all visible fields in a specific step.
 */
export function validateStep(
  fields: QuestionFieldConfig[],
  formData: Record<string, unknown>
): FieldErrorMap {
  const errors: FieldErrorMap = {};

  for (const field of fields) {
    if (!isFieldVisible(field, formData)) {
      continue;
    }

    const err = validateField(field, formData[field.id]);
    if (err) {
      errors[field.id] = err;
    }
  }

  return errors;
}
