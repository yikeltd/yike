/**
 * LearningLayer — reserved interface for a future ML/feedback-loop phase
 * (e.g. learning better price bands or recommendation ranking from
 * outcomes). NOT IMPLEMENTED. Founder authority for this sprint is
 * explicit: no ML/LLM/learning algorithms. This interface exists purely so
 * the shape is reserved and future work has a stable seam.
 */
export type LearningSignal = {
  kind: string;
  payload: Record<string, unknown>;
};

export interface LearningLayer {
  /** Reserved — always throws `NotImplementedError` in CORE. */
  recordOutcome(signal: LearningSignal): void;
  /** Reserved — always throws `NotImplementedError` in CORE. */
  getLearnedAdjustment(key: string): number | undefined;
}
