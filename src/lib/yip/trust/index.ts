import type { YipContext } from "../context/types";
import type { TrustAssessment, TrustService } from "./types";

/** Stub — no signals computed, no flags raised. Real trust scoring is V2. */
export class StubTrustService implements TrustService {
  assess(_context: YipContext): TrustAssessment {
    return { score: "low", signals: [], flags: [] };
  }
}

export function createTrustService(): TrustService {
  return new StubTrustService();
}

export type { TrustAssessment, TrustService } from "./types";
