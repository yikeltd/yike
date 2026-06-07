import { normalizeLocationParts } from "@/lib/location/canonical";
import { listingPurposeFromType } from "@/lib/pricing/purpose";
import type {
  MarketPriceMemoryRow,
  MarketPriceSnapshot,
  PriceAnalysisInput,
  PriceAnalysisResult,
  PriceAnomalyLevel,
} from "@/lib/pricing/types";

const MIN_SAMPLES_SOFT = 5;
const MIN_SAMPLES_STRONG = 12;

function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo] ?? null;
  const a = sorted[lo] ?? 0;
  const b = sorted[hi] ?? 0;
  return a + (b - a) * (idx - lo);
}

export function memoryToSnapshot(row: MarketPriceMemoryRow): MarketPriceSnapshot {
  return {
    sample_count: row.sample_count,
    median_price: row.median_price,
    p25_price: row.p25_price,
    p75_price: row.p75_price,
    p90_price: row.p90_price,
    confidence_level: row.confidence_level,
    currency: row.currency,
  };
}

export function agentToleranceMultiplier(input: PriceAnalysisInput): number {
  let m = 1;
  if (input.agentVerified) m += 0.35;
  if (input.companyVerified) m += 0.25;
  if (input.yikeVerified) m += 0.3;
  if (input.premiumPartner) m += 0.2;
  return m;
}

export function analyzeListingPrice(
  input: PriceAnalysisInput,
  memory: MarketPriceMemoryRow | null,
  luxuryMultiplier = 1
): PriceAnalysisResult {
  const loc = normalizeLocationParts(input);
  const purpose = listingPurposeFromType(input.listing_type, input.property_type);
  const price = Number(input.price);
  const tolerance = agentToleranceMultiplier(input) * luxuryMultiplier;

  if (!memory || memory.sample_count < MIN_SAMPLES_SOFT) {
    return {
      anomaly_level: "insufficient_data",
      confidence_score: Math.min(40, memory?.sample_count ?? 0) * 4,
      reason: null,
      suggested_range: null,
      market_snapshot: memory ? memoryToSnapshot(memory) : null,
      requires_agent_confirmation: false,
      requires_admin_review: false,
      price_review_status: "none",
    };
  }

  const snap = memoryToSnapshot(memory);
  const median = memory.median_price ?? memory.avg_price;
  const p25 = memory.p25_price;
  const p75 = memory.p75_price;
  const p90 = memory.p90_price;

  if (!median || median <= 0) {
    return {
      anomaly_level: "insufficient_data",
      confidence_score: 20,
      reason: null,
      suggested_range: null,
      market_snapshot: snap,
      requires_agent_confirmation: false,
      requires_admin_review: false,
      price_review_status: "none",
    };
  }

  let anomaly: PriceAnomalyLevel = "normal";
  let reason: string | null = null;
  let requires_agent_confirmation = false;
  let requires_admin_review = false;

  const highBand = p90 ?? p75 ?? median * 1.5;
  const lowBand = p25 ?? median * 0.5;

  if (luxuryMultiplier >= 2 && price > median * 1.8) {
    anomaly = "luxury_exception";
    reason = `Premium area (${loc.canonicalArea}) — wider price range expected.`;
  } else if (price >= highBand * (2.2 / tolerance)) {
    anomaly = "unusually_high";
    reason = `Price is well above similar ${input.property_type} listings in ${loc.canonicalArea}, ${loc.state}.`;
    requires_agent_confirmation = true;
    requires_admin_review = memory.sample_count >= MIN_SAMPLES_STRONG;
  } else if (price >= highBand * (1.45 / tolerance)) {
    anomaly = "high";
    reason = `Price is higher than most similar listings nearby.`;
    requires_agent_confirmation = true;
  } else if (price >= (p75 ?? median) * (1.25 / tolerance)) {
    anomaly = "slightly_high";
    reason = `Price differs from similar listings in this area.`;
    requires_agent_confirmation = memory.sample_count >= MIN_SAMPLES_STRONG;
  } else if (price <= lowBand * (0.35 * tolerance)) {
    anomaly = "unusually_low";
    reason = `Price is much lower than similar ${input.property_type} listings in ${loc.canonicalArea}.`;
    requires_agent_confirmation = true;
    requires_admin_review = memory.sample_count >= MIN_SAMPLES_STRONG;
  } else if (price <= (p25 ?? median * 0.7) * (0.65 * tolerance)) {
    anomaly = "slightly_low";
    reason = `Price is lower than most similar listings nearby.`;
    requires_agent_confirmation = memory.sample_count >= MIN_SAMPLES_STRONG;
  }

  const confidence_score = Math.min(
    100,
    Math.round(
      (memory.confidence_level === "high"
        ? 85
        : memory.confidence_level === "medium"
          ? 65
          : 45) +
        Math.min(memory.sample_count, 30)
    )
  );

  const suggested_range =
    p25 != null && p75 != null
      ? { min: Math.round(p25), max: Math.round(p75) }
      : median
        ? { min: Math.round(median * 0.75), max: Math.round(median * 1.35) }
        : null;

  if (input.agentVerified && anomaly !== "unusually_low" && anomaly !== "unusually_high") {
    requires_agent_confirmation = false;
    if (anomaly === "high" || anomaly === "slightly_high") {
      requires_admin_review = requires_admin_review || memory.sample_count >= MIN_SAMPLES_STRONG;
    }
  }

  return {
    anomaly_level: anomaly,
    confidence_score,
    reason,
    suggested_range,
    market_snapshot: snap,
    requires_agent_confirmation,
    requires_admin_review,
    price_review_status: requires_agent_confirmation
      ? "needs_confirmation"
      : requires_admin_review
        ? "admin_review"
        : "none",
  };
}

/** Compute percentiles from price array for market memory row. */
export function computePriceStats(prices: number[]): {
  min_price: number;
  max_price: number;
  avg_price: number;
  median_price: number;
  p25_price: number;
  p75_price: number;
  p90_price: number;
  confidence_level: "low" | "medium" | "high";
} {
  const sorted = [...prices].filter((p) => p > 0).sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  const median = percentile(sorted, 0.5) ?? 0;
  return {
    min_price: sorted[0] ?? 0,
    max_price: sorted[n - 1] ?? 0,
    avg_price: n ? sum / n : 0,
    median_price: median,
    p25_price: percentile(sorted, 0.25) ?? median,
    p75_price: percentile(sorted, 0.75) ?? median,
    p90_price: percentile(sorted, 0.9) ?? sorted[n - 1] ?? median,
    confidence_level: n >= 20 ? "high" : n >= 8 ? "medium" : "low",
  };
}
