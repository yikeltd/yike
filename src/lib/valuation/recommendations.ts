import type { ValuationMarketPosition } from "@/lib/valuation/types";

export function buildRecommendation(input: {
  marketPosition: ValuationMarketPosition;
  askPrice: number;
  estimate: number;
  priceLow: number;
  priceHigh: number;
  confidence: number;
  city?: string;
  vertical: string;
}): string {
  const {
    marketPosition,
    askPrice,
    estimate,
    priceLow,
    priceHigh,
    confidence,
    city,
    vertical,
  } = input;

  const location = city ? ` in ${city}` : "";
  const noun = vertical === "vehicle" ? "vehicle" : "property";

  if (confidence < 0.35) {
    return `Limited comparable data${location}. Treat this ${noun} estimate as directional only.`;
  }

  switch (marketPosition) {
    case "below_market":
      return `Asking price is below our estimated range (₦${priceLow.toLocaleString()}–₦${priceHigh.toLocaleString()}). This ${noun} may offer strong value${location}.`;
    case "above_market":
      return `Asking price is above our estimate of ₦${estimate.toLocaleString()}. Consider negotiating or comparing similar listings${location}.`;
    case "luxury_premium":
      return "Price reflects a premium segment. Verify unique features and seller credibility before proceeding.";
    case "fair_market":
    default:
      if (
        askPrice > 0 &&
        estimate > 0 &&
        Math.abs(askPrice - estimate) / estimate < 0.05
      ) {
        return `Asking price aligns with market estimates for this ${noun}${location}.`;
      }
      return `Estimated fair range: ₦${priceLow.toLocaleString()}–₦${priceHigh.toLocaleString()}${location}.`;
  }
}
