import type { QuestionFieldConfig } from "../types";
import { isFieldVisible } from "../questions/evaluator";
import { validateField, type FieldErrorMap } from "./validator";
import { listingEnginePlugins } from "../plugins/registry";

/**
 * Composite validator executing standard rules, custom registered validators,
 * and cross-field checks.
 */
export async function validateStepComposite(
  fields: QuestionFieldConfig[],
  formData: Record<string, unknown>
): Promise<FieldErrorMap> {
  const errors: FieldErrorMap = {};

  for (const field of fields) {
    if (!isFieldVisible(field, formData)) {
      continue;
    }

    // 1. Synchronous rule validation
    const syncErr = validateField(field, formData[field.id]);
    if (syncErr) {
      errors[field.id] = syncErr;
      continue;
    }

    // 2. Custom registered plugin validators
    const customValidator = listingEnginePlugins.getValidator(field.id);
    if (customValidator) {
      const customErr = await customValidator(formData[field.id], formData, field);
      if (customErr) {
        errors[field.id] = customErr;
      }
    }
  }

  return errors;
}
