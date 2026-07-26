import type { YipContext } from "../context/types";
import type { ValidationOutcome, ValidationService } from "./types";

/**
 * Passthrough — always reports ok. Applications should keep using
 * listing-engine's `validateValues` for real field validation today; wire a
 * listing-engine-backed implementation here when consolidating (see
 * docs/architecture/YIKE_INTELLIGENCE_PLATFORM.md migration notes).
 */
export class PassthroughValidationService implements ValidationService {
  validate(_context: YipContext): ValidationOutcome {
    return { ok: true, errors: {} };
  }
}

export function createValidationService(): ValidationService {
  return new PassthroughValidationService();
}

export type { ValidationOutcome, ValidationService } from "./types";
