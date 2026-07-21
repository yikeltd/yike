export type ValuationMarketPosition =
  | "below_market"
  | "fair_market"
  | "above_market"
  | "luxury_premium";

export type ValuationSubject = {
  askPrice: number;
  city?: string;
  condition?: string;
  attributes: Record<string, unknown>;
  featureCount?: number;
  verificationStatus?: string;
  vendorTrustScore?: number;
};

export type ValuationComparable = {
  price: number;
  weight: number;
  bedrooms?: number;
  bathrooms?: number;
};

export type ValuationMarketContext = {
  medianPrice: number;
  liquidityRatio?: number;
  source: "intelligence" | "fallback" | string;
};

export type ValuationFactors = {
  baseComparableValue: number;
  marketMedianBlend: number;
  conditionMultiplier: number;
  yearDepreciationMultiplier: number;
  mileageMultiplier: number;
  bedroomMultiplier: number;
  bathroomMultiplier: number;
  landSizeMultiplier: number;
  featureMultiplier: number;
  verificationMultiplier: number;
  trustMultiplier: number;
  marketTrendMultiplier: number;
  comparablesUsed: number;
  intelligenceAvailable: boolean;
};

export type ValuationResult = {
  estimatedValue: number;
  priceLow: number;
  priceHigh: number;
  confidenceScore: number;
  marketPosition: ValuationMarketPosition;
  askPrice: number;
  variancePct: number;
  recommendation: string;
  factors: ValuationFactors;
  comparables: ValuationComparable[];
  engineVersion: string;
  modelProvider: string;
};
