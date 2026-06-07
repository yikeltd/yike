export type ListingPurpose =
  | "rent"
  | "sale"
  | "land_sale"
  | "commercial_rent"
  | "commercial_sale";

export type PriceAnomalyLevel =
  | "normal"
  | "slightly_high"
  | "high"
  | "unusually_high"
  | "slightly_low"
  | "unusually_low"
  | "luxury_exception"
  | "insufficient_data";

export type PriceReviewStatus =
  | "none"
  | "needs_confirmation"
  | "confirmed_by_agent"
  | "admin_review"
  | "approved"
  | "adjusted"
  | "ignored";

export type MarketPriceSnapshot = {
  sample_count: number;
  median_price: number | null;
  p25_price: number | null;
  p75_price: number | null;
  p90_price: number | null;
  confidence_level: string;
  currency: string;
};

export type PriceAnalysisInput = {
  state: string;
  city: string;
  lga?: string | null;
  area: string;
  neighborhood?: string | null;
  property_type: string;
  listing_type: string;
  price: number;
  bedrooms?: number;
  agentVerified?: boolean;
  companyVerified?: boolean;
  yikeVerified?: boolean;
  premiumPartner?: boolean;
};

export type PriceAnalysisResult = {
  anomaly_level: PriceAnomalyLevel;
  confidence_score: number;
  reason: string | null;
  suggested_range: { min: number; max: number } | null;
  market_snapshot: MarketPriceSnapshot | null;
  requires_agent_confirmation: boolean;
  requires_admin_review: boolean;
  price_review_status: PriceReviewStatus;
};

export type MarketPriceMemoryRow = {
  id: string;
  state: string;
  city: string | null;
  lga: string | null;
  area: string | null;
  neighborhood: string | null;
  property_type: string;
  listing_purpose: string;
  bedrooms: number | null;
  sample_count: number;
  min_price: number | null;
  max_price: number | null;
  avg_price: number | null;
  median_price: number | null;
  p25_price: number | null;
  p75_price: number | null;
  p90_price: number | null;
  currency: string;
  confidence_level: string;
};
