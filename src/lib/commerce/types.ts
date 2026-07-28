/**
 * Commerce Platform & Canonical Deal Engine — Types & Models (Phase 1.4)
 *
 * Establishes Deal as the central business object for marketplace transactions.
 */

export type DealStage =
  | "LEAD"
  | "QUALIFIED"
  | "VIEWING"
  | "INSPECTION"
  | "NEGOTIATION"
  | "OFFER_ACCEPTED"
  | "CONTRACT_PENDING"
  | "COMPLETED"
  | "CANCELLED"
  | "LOST";

export type DealStatus = "active" | "completed" | "cancelled" | "lost";

export type StageTransitionRecord = {
  fromStage: DealStage;
  toStage: DealStage;
  enteredAt: string;
  exitedAt?: string | null;
  durationMinutes?: number | null;
  actorId: string;
  reason?: string;
};

export type DealTimelineEventType =
  | "deal_created"
  | "stage_changed"
  | "viewing_completed"
  | "inspection_completed"
  | "offer_submitted"
  | "offer_accepted"
  | "contract_pending"
  | "deal_completed"
  | "deal_cancelled"
  | "review_unlocked"
  | "review_submitted";

export type DealTimelineEvent = {
  id: string;
  dealId: string;
  eventType: DealTimelineEventType;
  actorId: string;
  actorName: string;
  title: string;
  description?: string;
  createdAt: string;
};

export type GatedReview = {
  id: string;
  dealId: string;
  listingId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: "buyer" | "seller";
  targetUserId: string;
  rating: number; // 1 to 5
  feedback: string;
  createdAt: string;
};

export type Deal = {
  id: string;
  conversationId: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  offerId?: string | null;
  currentStage: DealStage;
  currentValue: number;
  currency: string;
  status: DealStatus;
  daysOpen: number;
  stageHistory: StageTransitionRecord[];
  timeline: DealTimelineEvent[];
  reviews: GatedReview[];
  reviewGatewayUnlocked: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  cancelledAt?: string | null;
  completionReason?: string;
};

export type CommerceFunnelMetrics = {
  totalDeals: number;
  activeDeals: number;
  completedDeals: number;
  conversionRates: {
    leadToViewingPercentage: number;
    viewingToInspectionPercentage: number;
    inspectionToOfferPercentage: number;
    offerToDealPercentage: number;
    dealToReviewPercentage: number;
  };
  avgDealDurationDays: number;
  avgNegotiationCount: number;
  avgDealValueAmount: number;
};
