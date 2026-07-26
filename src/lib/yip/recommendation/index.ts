import type { YipContext } from "../context/types";
import type { Recommendation, RecommendationEngine } from "./types";

/** Always returns an empty list — recommendation logic is V2/disabled by default in the registry. */
export class StubRecommendationEngine implements RecommendationEngine {
  recommend(_context: YipContext): Recommendation[] {
    return [];
  }
}

export function createRecommendationEngine(): RecommendationEngine {
  return new StubRecommendationEngine();
}

export type { Recommendation, RecommendationEngine } from "./types";
