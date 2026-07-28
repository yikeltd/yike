/**
 * Intelligence Platform — Type Definitions (Phase 1.9)
 *
 * Core domain contracts for Buyer, Seller, Commerce, Trust, and Operations Intelligence.
 */

export type InsightCategory =
  | "buyer"
  | "seller"
  | "commerce"
  | "trust"
  | "operations";

export type InsightPriority = "critical" | "high" | "medium" | "low";

export type ActionLink = {
  label: string;
  href: string;
};

export type PlatformInsight = {
  id: string;
  category: InsightCategory;
  title: string;
  priority: InsightPriority;
  reason: string;
  recommendation: string;
  confidenceScore: number; // 0-100%
  sourcePlatform: string;
  action?: ActionLink;
  createdAt: string;
};

/** Buyer Intelligence Insights */
export type BuyerRecommendation = {
  listingId: string;
  title: string;
  matchScore: number; // 0-100%
  priceDropDetected: boolean;
  isVerifiedSeller: boolean;
  matchReason: string;
};

/** Seller Intelligence Insights */
export type SellerListingScore = {
  listingId: string;
  qualityScore: number; // 0-100
  titleQuality: number;
  photoQuality: number;
  pricingCompetitiveness: number;
  recommendations: string[];
};

export type SellerIntelligenceSnapshot = {
  sellerId: string;
  responseScore: number; // 0-100
  leadQualityScore: number; // 0-100
  inventoryHealthScore: number; // 0-100
  bestTimeToRespond: string;
  bestTimeToPost: string;
  insights: PlatformInsight[];
};

/** Commerce Intelligence Insights */
export type DealMomentum = "accelerating" | "stable" | "stalled" | "at_risk";

export type DealHealthAnalysis = {
  dealId: string;
  healthScore: number; // 0-100
  probabilityOfClosing: number; // 0-100%
  momentum: DealMomentum;
  daysInCurrentStage: number;
  negotiationRisk: "low" | "medium" | "high";
  inspectionRisk: "low" | "medium" | "high";
  nextBestAction: {
    label: string;
    actionType: "schedule_viewing" | "follow_up" | "counter_offer" | "request_inspection" | "complete_deal";
    href: string;
  };
  warnings: string[];
};

/** Trust Intelligence Plan */
export type TrustGrowthItem = {
  signalKey: string;
  title: string;
  potentialPoints: number;
  completed: boolean;
  actionHref: string;
};

export type TrustGrowthPlan = {
  userId: string;
  currentScore: number;
  potentialScore: number;
  items: TrustGrowthItem[];
  insights: PlatformInsight[];
};

/** Operations Intelligence Case Priority */
export type OperationsCasePriority = {
  caseId: string;
  priorityScore: number; // 0-100
  urgencyLevel: "critical" | "high" | "medium" | "low";
  riskScore: number; // 0-100
  slaRemainingHours: number;
  slaRiskWarning: boolean;
  recommendedOfficerRole: "field_verifier" | "legal_partner" | "customer_support";
  assignmentReason: string;
};
