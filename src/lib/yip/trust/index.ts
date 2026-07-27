/**
 * Trust assessment service — activates real engines via Trust Platform façade.
 * Stub retained only for tests that explicitly request it.
 */
import type { TrustService } from "./types";
import { createTrustPlatform } from "../capabilities/trust";

export function createTrustService(): TrustService {
  return createTrustPlatform();
}

/** @deprecated Neutral stub — prefer createTrustService() */
export class StubTrustService implements TrustService {
  assess() {
    return { score: "low" as const, signals: [] as string[], flags: [] as string[] };
  }
}

export type { TrustAssessment, TrustService } from "./types";
