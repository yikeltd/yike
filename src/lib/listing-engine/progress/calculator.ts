import type { ListingCategoryConfig } from "../types";
import { isFieldVisible } from "../questions/evaluator";

export type ProgressMetrics = {
  totalVisibleFields: number;
  completedFields: number;
  remainingRequiredFields: number;
  completionPercent: number;
  estimatedMinutesLeft: number;
};

export function calculateProgress(
  category: ListingCategoryConfig,
  formData: Record<string, unknown>
): ProgressMetrics {
  let totalVisibleFields = 0;
  let completedFields = 0;
  let remainingRequiredFields = 0;

  for (const step of category.steps) {
    for (const field of step.fields) {
      if (!isFieldVisible(field, formData)) {
        continue;
      }

      totalVisibleFields++;
      const val = formData[field.id];
      const isFilled =
        val !== undefined &&
        val !== null &&
        val !== "" &&
        !(Array.isArray(val) && val.length === 0);

      if (isFilled) {
        completedFields++;
      }

      const isRequired = field.validation?.some((r) => r.type === "required" || r.type === "minPhotos");
      if (isRequired && !isFilled) {
        remainingRequiredFields++;
      }
    }
  }

  const completionPercent =
    totalVisibleFields > 0
      ? Math.min(100, Math.round((completedFields / totalVisibleFields) * 100))
      : 0;

  // Approx 15 seconds per remaining required field
  const estimatedMinutesLeft = Math.max(1, Math.ceil((remainingRequiredFields * 15) / 60));

  return {
    totalVisibleFields,
    completedFields,
    remainingRequiredFields,
    completionPercent,
    estimatedMinutesLeft,
  };
}
