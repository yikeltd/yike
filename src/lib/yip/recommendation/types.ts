/**
 * RecommendationEngine — surfaces suggestions (related listings, upsells,
 * "complete your listing" nudges). CORE ships an empty-result stub.
 */
import type { Confidence } from "../shared/types";
import type { YipContext } from "../context/types";

export type Recommendation = {
  id: string;
  kind: string;
  label: string;
  confidence: Confidence;
};

export interface RecommendationEngine {
  recommend(context: YipContext): Recommendation[];
}
