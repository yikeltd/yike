/**
 * Seller Success Platform (Seller CRM / Yike Business Cloud) — Types & Models (Phase 1.5)
 *
 * Governs Seller CRM pipeline, inventory health, recommendations, activity feed, and insights.
 */

export type PipelineStage =
  | "NEW_LEAD"
  | "CONTACTED"
  | "VIEWING_SCHEDULED"
  | "INSPECTION"
  | "NEGOTIATION"
  | "OFFER_ACCEPTED"
  | "CONTRACT_PENDING"
  | "COMPLETED"
  | "LOST";

export type LeadCard = {
  id: string;
  dealId: string;
  conversationId: string;
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  listingImage?: string;
  buyerId: string;
  buyerName: string;
  buyerPhone?: string;
  stage: PipelineStage;
  dealValue: number;
  daysInStage: number;
  lastActivityAt: string;
  scheduledViewingAt?: string | null;
  latestOfferAmount?: number | null;
  inspectionStatus?: "none" | "requested" | "in_progress" | "completed";
  trustScore: number;
};

export type RecommendationType =
  | "low_engagement"
  | "needs_better_photos"
  | "price_review_suggested"
  | "respond_faster"
  | "boost_recommended";

export type RuleRecommendation = {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  actionLabel: string;
  actionTarget: string;
};

export type InventoryHealth = {
  listingId: string;
  listingTitle: string;
  price: number;
  imageUrl?: string;
  status: string;
  viewsCount: number;
  conversationsCount: number;
  qualifiedLeadsCount: number;
  viewingsCount: number;
  offersCount: number;
  dealsCount: number;
  daysOnMarket: number;
  recommendations: RuleRecommendation[];
};

export type ActivityItem = {
  id: string;
  type:
    | "new_conversation"
    | "new_message"
    | "viewing_confirmed"
    | "inspection_completed"
    | "offer_received"
    | "offer_accepted"
    | "review_received"
    | "badge_earned"
    | "case_updated";
  title: string;
  description: string;
  timestamp: string;
  linkHref?: string;
};

export type PerformanceInsight = {
  id: string;
  category: "response" | "conversion" | "pricing" | "trust";
  title: string;
  metricLabel: string;
  metricValue: string;
  trend: "up" | "down" | "stable";
  suggestion: string;
};

export type AutomationHook = {
  id: string;
  triggerEvent:
    | "followup_reminder"
    | "viewing_reminder"
    | "inspection_reminder"
    | "offer_expiry_reminder"
    | "dormant_lead_reminder";
  leadId: string;
  buyerName: string;
  dueAt: string;
  status: "pending" | "executed" | "dismissed";
};

export type SellerCrmSnapshot = {
  sellerId: string;
  sellerName: string;
  trustScore: number;
  unreadMessagesCount: number;
  metrics: {
    todayActivityCount: number;
    newLeadsCount: number;
    activeConversationsCount: number;
    dealsInProgressCount: number;
    scheduledViewingsCount: number;
    pendingInspectionsCount: number;
    pendingOffersCount: number;
    completedDealsCount: number;
  };
  pipeline: LeadCard[];
  inventoryHealth: InventoryHealth[];
  activityFeed: ActivityItem[];
  insights: PerformanceInsight[];
  automations: AutomationHook[];
};
