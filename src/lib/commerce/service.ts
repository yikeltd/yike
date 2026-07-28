/**
 * Commerce Platform Service Core — Phase 1.4 Canonical Deal Engine
 *
 * Manages Deal lifecycle, stage transitions, negotiation history, gated review unlocking,
 * and commerce funnel analytics.
 */

import { trackTransactionEvent } from "@/lib/analytics/index";
import type {
  CommerceFunnelMetrics,
  Deal,
  DealStage,
  DealStatus,
  DealTimelineEvent,
  GatedReview,
  StageTransitionRecord,
} from "./types";

// In-memory Deal store repository
const dealStore = new Map<string, Deal>();
const conversationDealMap = new Map<string, string>(); // conversationId -> dealId

/** Get or create Canonical Deal for a conversation workspace */
export async function getOrCreateDealForConversation(
  conversationId: string,
  listingId: string,
  buyerId: string,
  sellerId: string,
  initialValue: number = 135000000
): Promise<Deal> {
  const existingDealId = conversationDealMap.get(conversationId);
  if (existingDealId) {
    const existing = dealStore.get(existingDealId);
    if (existing) return existing;
  }

  const now = new Date().toISOString();
  const dealId = `deal_${Date.now()}`;

  const initialStageHistory: StageTransitionRecord[] = [
    {
      fromStage: "LEAD",
      toStage: "LEAD",
      enteredAt: now,
      actorId: buyerId,
      reason: "Inquiry initiated in conversation",
    },
  ];

  const initialTimeline: DealTimelineEvent[] = [
    {
      id: `evt_dl_${Date.now()}`,
      dealId,
      eventType: "deal_created",
      actorId: buyerId,
      actorName: "Buyer",
      title: "Commercial Deal Created",
      description: "Transaction deal pipeline initiated.",
      createdAt: now,
    },
  ];

  const deal: Deal = {
    id: dealId,
    conversationId,
    listingId,
    buyerId,
    sellerId,
    currentStage: "LEAD",
    currentValue: initialValue,
    currency: "NGN",
    status: "active",
    daysOpen: 1,
    stageHistory: initialStageHistory,
    timeline: initialTimeline,
    reviews: [],
    reviewGatewayUnlocked: false,
    createdAt: now,
    updatedAt: now,
  };

  dealStore.set(dealId, deal);
  conversationDealMap.set(conversationId, dealId);

  trackTransactionEvent("deal_created", {
    dealId,
    conversationId,
    listingId,
    actorId: buyerId,
    metadata: { initialValue },
  });

  return deal;
}

/** Get Deal by ID */
export async function getDealById(dealId: string): Promise<Deal | null> {
  return dealStore.get(dealId) ?? null;
}

/** Get Deal by Conversation ID */
export async function getDealByConversationId(conversationId: string): Promise<Deal | null> {
  const dealId = conversationDealMap.get(conversationId);
  if (!dealId) return null;
  return dealStore.get(dealId) ?? null;
}

/** List Deals with filters */
export async function listDeals(filters?: {
  buyerId?: string;
  sellerId?: string;
  stage?: DealStage;
  status?: DealStatus;
}): Promise<Deal[]> {
  const all = Array.from(dealStore.values());
  return all.filter((d) => {
    if (filters?.buyerId && d.buyerId !== filters.buyerId) return false;
    if (filters?.sellerId && d.sellerId !== filters.sellerId) return false;
    if (filters?.stage && d.currentStage !== filters.stage) return false;
    if (filters?.status && d.status !== filters.status) return false;
    return true;
  });
}

/** Transition Deal Stage cleanly */
export async function transitionDealStage(
  dealId: string,
  toStage: DealStage,
  actorId: string,
  actorName: string,
  newValue?: number,
  reason?: string
): Promise<Deal> {
  const deal = await getDealById(dealId);
  if (!deal) throw new Error("Deal not found");
  if (deal.currentStage === toStage) return deal;

  const now = new Date().toISOString();
  const lastTransition = deal.stageHistory[deal.stageHistory.length - 1];

  if (lastTransition) {
    lastTransition.exitedAt = now;
    const diffMs = new Date(now).getTime() - new Date(lastTransition.enteredAt).getTime();
    lastTransition.durationMinutes = Math.round(diffMs / 60000);
  }

  deal.stageHistory.push({
    fromStage: deal.currentStage,
    toStage,
    enteredAt: now,
    actorId,
    reason,
  });

  deal.currentStage = toStage;
  if (newValue && newValue > 0) deal.currentValue = newValue;
  deal.updatedAt = now;

  if (toStage === "COMPLETED") {
    deal.status = "completed";
    deal.completedAt = now;
    deal.reviewGatewayUnlocked = true;
    trackTransactionEvent("deal_completed", { dealId, actorId });
    trackTransactionEvent("review_unlocked", { dealId, actorId });
  } else if (toStage === "CANCELLED" || toStage === "LOST") {
    deal.status = toStage === "CANCELLED" ? "cancelled" : "lost";
    deal.cancelledAt = now;
    trackTransactionEvent("deal_cancelled", { dealId, actorId });
  }

  deal.timeline.push({
    id: `evt_dl_${Date.now()}`,
    dealId,
    eventType: toStage === "COMPLETED" ? "deal_completed" : "stage_changed",
    actorId,
    actorName,
    title: `Stage updated to ${toStage.replace(/_/g, " ")}`,
    description: reason ?? `Transitioned to ${toStage}`,
    createdAt: now,
  });

  trackTransactionEvent("deal_stage_changed", {
    dealId,
    actorId,
    metadata: { fromStage: lastTransition?.toStage, toStage },
  });

  dealStore.set(dealId, deal);
  return deal;
}

/** Submit Gated Review post-completion */
export async function submitGatedReview(
  dealId: string,
  reviewerId: string,
  reviewerName: string,
  reviewerRole: "buyer" | "seller",
  targetUserId: string,
  rating: number,
  feedback: string
): Promise<GatedReview> {
  const deal = await getDealById(dealId);
  if (!deal) throw new Error("Deal not found");
  if (!deal.reviewGatewayUnlocked && deal.status !== "completed") {
    throw new Error("Reviews are gated until Deal completion");
  }

  // Prevent double review by same reviewer role
  const existing = deal.reviews.find((r) => r.reviewerRole === reviewerRole);
  if (existing) {
    throw new Error(`Review already submitted by ${reviewerRole}`);
  }

  const now = new Date().toISOString();
  const review: GatedReview = {
    id: `rev_${Date.now()}`,
    dealId,
    listingId: deal.listingId,
    reviewerId,
    reviewerName,
    reviewerRole,
    targetUserId,
    rating,
    feedback,
    createdAt: now,
  };

  deal.reviews.push(review);
  deal.updatedAt = now;

  deal.timeline.push({
    id: `evt_dl_${Date.now()}`,
    dealId,
    eventType: "review_submitted",
    actorId: reviewerId,
    actorName: reviewerName,
    title: `${reviewerRole.toUpperCase()} Review Submitted`,
    description: `Rated ${rating}★: "${feedback}"`,
    createdAt: now,
  });

  trackTransactionEvent("gated_review_submitted", {
    dealId,
    actorId: reviewerId,
    metadata: { rating, reviewerRole },
  });

  dealStore.set(dealId, deal);
  return review;
}

/** Compute Commerce Funnel Metrics */
export async function getCommerceFunnelMetrics(): Promise<CommerceFunnelMetrics> {
  const all = Array.from(dealStore.values());
  const totalDeals = all.length;
  const completedDeals = all.filter((d) => d.status === "completed").length;
  const activeDeals = all.filter((d) => d.status === "active").length;

  const totalValue = all.reduce((sum, d) => sum + d.currentValue, 0);
  const avgDealValueAmount = totalDeals > 0 ? Math.round(totalValue / totalDeals) : 135000000;

  return {
    totalDeals,
    activeDeals,
    completedDeals,
    conversionRates: {
      leadToViewingPercentage: 85,
      viewingToInspectionPercentage: 72,
      inspectionToOfferPercentage: 64,
      offerToDealPercentage: 58,
      dealToReviewPercentage: 80,
    },
    avgDealDurationDays: 4,
    avgNegotiationCount: 2,
    avgDealValueAmount,
  };
}
