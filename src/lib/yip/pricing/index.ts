import type { YipContext } from "../context/types";
import type { MarketAnalysis, PricingService } from "./types";

/** Stub — registered disabled by default (see registry defaults). Real comps require V2 data pipeline. */
export class StubPricingService implements PricingService {
  analyze(_context: YipContext): MarketAnalysis {
    return { available: false, reason: "insufficient_data" };
  }
}

export function createPricingService(): PricingService {
  return new StubPricingService();
}

export type { MarketAnalysis, PricingService } from "./types";
