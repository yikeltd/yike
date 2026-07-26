/**
 * Default market knowledge provider — CORE stub.
 *
 * Real price intelligence needs a comps data pipeline (sold/active listing
 * history, geo-normalization, outlier handling). That's explicitly V2 —
 * see docs/architecture/YIKE_INTELLIGENCE_PLATFORM.md "what's not built yet".
 * This provider always reports `available: false` so callers can render an
 * honest "not enough data yet" state instead of a fabricated number.
 */
import { ok } from "../shared/types";
import type { Result } from "../shared/types";
import type { MarketKnowledge, PriceSuggestion, PriceSuggestionInput } from "./types";

export class DefaultMarketKnowledge implements MarketKnowledge {
  getPriceSuggestion(_input: PriceSuggestionInput): Result<PriceSuggestion> {
    return ok({ available: false, reason: "insufficient_data" });
  }
}

export function createMarketKnowledge(): MarketKnowledge {
  return new DefaultMarketKnowledge();
}
