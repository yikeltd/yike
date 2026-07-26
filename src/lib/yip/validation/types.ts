/**
 * ValidationService — intelligence-layer validation surface. For CORE this
 * is a thin passthrough; the real per-field rule engine already lives in
 * `src/lib/listing-engine/validation.ts`. This interface exists so future
 * cross-field / cross-listing intelligence (duplicate detection, anomaly
 * flags) has a stable seam to plug into without applications changing how
 * they call validation.
 */
import type { YipContext } from "../context/types";

export type ValidationOutcome = {
  ok: boolean;
  errors: Record<string, string>;
};

export interface ValidationService {
  validate(context: YipContext): ValidationOutcome;
}
