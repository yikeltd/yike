import { generateFollowUpQuestions } from "./generate-questions";
import type { FollowUpGenerationInput, FollowUpQuestion } from "./types";

/** Prefer a saved role template; otherwise build smart defaults locally (no API). */
export function resolveInitialFollowUpQuestions(
  input: FollowUpGenerationInput,
  savedTemplate?: FollowUpQuestion[] | null
): FollowUpQuestion[] {
  if (savedTemplate?.length) {
    return savedTemplate.map((q) => ({ ...q }));
  }
  return generateFollowUpQuestions(input);
}
