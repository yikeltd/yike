import { NotImplementedError } from "../shared/errors";
import type { LearningLayer, LearningSignal } from "./types";

/**
 * Not implemented. Every method throws `NotImplementedError` — this is
 * intentional and documents that YIP CORE does not learn from data. See
 * module header comment and docs/architecture/YIKE_INTELLIGENCE_PLATFORM.md.
 */
export class UnimplementedLearningLayer implements LearningLayer {
  recordOutcome(_signal: LearningSignal): void {
    throw new NotImplementedError("LearningLayer.recordOutcome");
  }

  getLearnedAdjustment(_key: string): number | undefined {
    throw new NotImplementedError("LearningLayer.getLearnedAdjustment");
  }
}

export function createLearningLayer(): LearningLayer {
  return new UnimplementedLearningLayer();
}

export type { LearningLayer, LearningSignal } from "./types";
