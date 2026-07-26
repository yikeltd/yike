import type { YipContext } from "../context/types";
import type { Decision, DecisionService } from "./types";

/** Always returns a no-op decision. Real rule-driven decisions are V2. */
export class NoOpDecisionService implements DecisionService {
  decide(_context: YipContext): Decision {
    return { action: "none", reason: "decision engine not implemented in CORE", confidence: "low" };
  }
}

export function createDecisionService(): DecisionService {
  return new NoOpDecisionService();
}

export type { Decision, DecisionService } from "./types";
