/**
 * PricingService — market analysis for a listing's asking price. CORE ships
 * a stub that always reports unavailable; see `knowledge/market.ts` for the
 * same honesty constraint applied at the knowledge layer.
 */
import type { YipContext } from "../context/types";

export type MarketAnalysis =
  | { available: false; reason: "insufficient_data" | (string & {}) }
  | {
      available: true;
      currency: "NGN";
      low: number;
      median: number;
      high: number;
      positioning: "under_priced" | "fair" | "over_priced";
      sampleSize: number;
    };

export interface PricingService {
  analyze(context: YipContext): MarketAnalysis;
}
