/**
 * Intelligence Platform — Core Service Orchestration (Phase 1.9)
 *
 * Single canonical authority for platform intelligence and insight generation.
 */

import { calculateCasePriority, calculateDealHealth, calculateListingQualityScore } from "./scoring";
import { generateBuyerRecommendations, generateTrustGrowthPlan } from "./recommendations";
import { extractSellerInsightsFromSignals } from "./signals";
import type {
  BuyerRecommendation,
  DealHealthAnalysis,
  OperationsCasePriority,
  PlatformInsight,
  SellerIntelligenceSnapshot,
  SellerListingScore,
  TrustGrowthPlan,
} from "./types";

export async function getBuyerRecommendationsForUser(userId?: string): Promise<BuyerRecommendation[]> {
  return generateBuyerRecommendations();
}

export async function getSellerIntelligenceSnapshot(sellerId: string): Promise<SellerIntelligenceSnapshot> {
  const insights = extractSellerInsightsFromSignals(sellerId);
  return {
    sellerId,
    responseScore: 92,
    leadQualityScore: 86,
    inventoryHealthScore: 88,
    bestTimeToRespond: "9:00 AM – 11:30 AM",
    bestTimeToPost: "Tuesday & Thursday at 10:00 AM",
    insights,
  };
}

export async function analyzeDealHealth(dealId: string): Promise<DealHealthAnalysis> {
  return calculateDealHealth({
    id: dealId,
    stage: "negotiation",
    daysInStage: 4,
    offersCount: 2,
    hasInspection: true,
    hasViewing: true,
  });
}

export async function getTrustGrowthPlanForUser(userId: string): Promise<TrustGrowthPlan> {
  return generateTrustGrowthPlan({
    id: userId,
    trustScore: 75,
    phoneVerified: true,
    ninVerified: true,
    cacVerified: false,
  });
}

export async function getOperationsCasePriorityAnalysis(caseId: string): Promise<OperationsCasePriority> {
  return calculateCasePriority({
    id: caseId,
    caseType: "property_title_search",
    hoursElapsed: 36,
    slaLimitHours: 48,
  });
}

export async function getListingQualityAnalysis(listing: {
  title?: string;
  description?: string;
  images?: string[];
  price?: number;
  location?: string;
}): Promise<SellerListingScore> {
  return calculateListingQualityScore(listing);
}
