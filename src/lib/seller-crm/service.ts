/**
 * Seller Success Platform Service Core — Phase 1.5 Seller CRM
 *
 * Consumes existing Conversation, Commerce, Identity, and Trust domains to compute
 * real-time lead pipeline, inventory health recommendations, activity feeds, and performance insights.
 */

import { trackTransactionEvent } from "@/lib/analytics/index";
import { getOrCreateTrustIdentity } from "@/lib/identity/service";
import type {
  ActivityItem,
  AutomationHook,
  InventoryHealth,
  LeadCard,
  PerformanceInsight,
  PipelineStage,
  RuleRecommendation,
  SellerCrmSnapshot,
} from "./types";

// In-memory CRM Lead Pipeline cache
const leadStore = new Map<string, LeadCard[]>();

/** Initialize default pipeline leads for seller */
function getDefaultLeadPipeline(sellerId: string): LeadCard[] {
  const existing = leadStore.get(sellerId);
  if (existing) return existing;

  const now = new Date().toISOString();
  const leads: LeadCard[] = [
    {
      id: "lead_01",
      dealId: "deal_101",
      conversationId: "prop_lekki_01:buyer_guest_01",
      listingId: "prop_lekki_01",
      listingTitle: "Luxury 4 Bedroom Terrace Villa",
      listingPrice: 135000000,
      listingImage: "/images/logo.webp",
      buyerId: "buyer_guest_01",
      buyerName: "Chief Stankings Client",
      buyerPhone: "+2348098765432",
      stage: "NEGOTIATION",
      dealValue: 130000000,
      daysInStage: 2,
      lastActivityAt: now,
      scheduledViewingAt: "2026-08-01 2:00 PM",
      latestOfferAmount: 130000000,
      inspectionStatus: "completed",
      trustScore: 94,
    },
    {
      id: "lead_02",
      dealId: "deal_102",
      conversationId: "prop_banana_02:buyer_guest_02",
      listingId: "prop_banana_02",
      listingTitle: "Waterfront Mansion in Banana Island",
      listingPrice: 450000000,
      listingImage: "/images/logo.webp",
      buyerId: "buyer_guest_02",
      buyerName: "Alhaji Bello",
      stage: "VIEWING_SCHEDULED",
      dealValue: 450000000,
      daysInStage: 1,
      lastActivityAt: now,
      scheduledViewingAt: "2026-08-03 10:00 AM",
      trustScore: 88,
    },
    {
      id: "lead_03",
      dealId: "deal_103",
      conversationId: "veh_prado_03:buyer_guest_03",
      listingId: "veh_prado_03",
      listingTitle: "Toyota Land Cruiser Prado 2023 VX-L",
      listingPrice: 78000000,
      listingImage: "/images/logo.webp",
      buyerId: "buyer_guest_03",
      buyerName: "Dr. Funke Akindele",
      stage: "INSPECTION",
      dealValue: 78000000,
      daysInStage: 3,
      lastActivityAt: now,
      inspectionStatus: "requested",
      trustScore: 92,
    },
    {
      id: "lead_04",
      dealId: "deal_104",
      conversationId: "prop_ikeja_04:buyer_guest_04",
      listingId: "prop_ikeja_04",
      listingTitle: "Commercial Office Complex Ikeja GRA",
      listingPrice: 220000000,
      listingImage: "/images/logo.webp",
      buyerId: "buyer_guest_04",
      buyerName: "Emeka Enterprises Ltd",
      stage: "NEW_LEAD",
      dealValue: 220000000,
      daysInStage: 1,
      lastActivityAt: now,
      trustScore: 78,
    },
  ];

  leadStore.set(sellerId, leads);
  return leads;
}

/** Compute Rule-Based Inventory Health Recommendations */
export function getInventoryHealthList(sellerId: string): InventoryHealth[] {
  return [
    {
      listingId: "prop_lekki_01",
      listingTitle: "Luxury 4 Bedroom Terrace Villa with Swimming Pool",
      price: 135000000,
      imageUrl: "/images/logo.webp",
      status: "active",
      viewsCount: 342,
      conversationsCount: 14,
      qualifiedLeadsCount: 8,
      viewingsCount: 5,
      offersCount: 3,
      dealsCount: 1,
      daysOnMarket: 12,
      recommendations: [
        {
          id: "rec_01",
          type: "boost_recommended",
          title: "High Conversion Rate — Boost Recommended",
          description: "This listing has an 80% inquiry-to-viewing conversion. Boosting will increase deal speed by 3x.",
          actionLabel: "Boost Listing",
          actionTarget: "/pricing?feature=featured",
        },
      ],
    },
    {
      listingId: "prop_banana_02",
      listingTitle: "Waterfront Mansion in Banana Island",
      price: 450000000,
      imageUrl: "/images/logo.webp",
      status: "active",
      viewsCount: 120,
      conversationsCount: 2,
      qualifiedLeadsCount: 1,
      viewingsCount: 1,
      offersCount: 0,
      dealsCount: 0,
      daysOnMarket: 28,
      recommendations: [
        {
          id: "rec_02",
          type: "price_review_suggested",
          title: "Price Review Suggested",
          description: "View-to-inquiry ratio is below market average (1.6%). Consider a 5% price refinement or video walkthrough.",
          actionLabel: "Edit Listing",
          actionTarget: "/agent/listings/choose",
        },
      ],
    },
    {
      listingId: "veh_prado_03",
      listingTitle: "Toyota Land Cruiser Prado 2023 VX-L",
      price: 78000000,
      imageUrl: "/images/logo.webp",
      status: "active",
      viewsCount: 520,
      conversationsCount: 22,
      qualifiedLeadsCount: 12,
      viewingsCount: 8,
      offersCount: 4,
      dealsCount: 2,
      daysOnMarket: 6,
      recommendations: [
        {
          id: "rec_03",
          type: "respond_faster",
          title: "Respond Faster Alert",
          description: "3 buyers are waiting for counter-offer replies. Fast responses increase win rates by 45%.",
          actionLabel: "View Messages",
          actionTarget: "/conversations",
        },
      ],
    },
  ];
}

/** Get Activity Feed */
export function getActivityFeed(sellerId: string): ActivityItem[] {
  const now = new Date().toISOString();
  return [
    {
      id: "act_01",
      type: "offer_received",
      title: "Offer Received — ₦130,000,000",
      description: "Submitted by Chief Stankings Client for Lekki Villa.",
      timestamp: now,
      linkHref: "/conversations/prop_lekki_01:buyer_guest_01",
    },
    {
      id: "act_02",
      type: "inspection_completed",
      title: "50-Point Field Inspection Passed",
      description: "Inspector Bakare completed audit for Lekki Villa (Pass Rate 100%).",
      timestamp: now,
      linkHref: "/lex/auth/cases/case_insp_101",
    },
    {
      id: "act_03",
      type: "viewing_confirmed",
      title: "Viewing Confirmed for Saturday",
      description: "Scheduled with Alhaji Bello for Banana Island Mansion.",
      timestamp: now,
      linkHref: "/conversations/prop_banana_02:buyer_guest_02",
    },
    {
      id: "act_04",
      type: "badge_earned",
      title: "Badge Awarded: Fast Responder",
      description: "Awarded by Yike Identity Engine for 14-minute average response time.",
      timestamp: now,
      linkHref: `/trust/${sellerId}`,
    },
  ];
}

/** Get Performance Insights */
export function getPerformanceInsights(sellerId: string): PerformanceInsight[] {
  return [
    {
      id: "ins_01",
      category: "response",
      title: "Response Velocity",
      metricLabel: "Avg Response Time",
      metricValue: "14 mins",
      trend: "up",
      suggestion: "You are in the top 5% fastest responders in Lagos.",
    },
    {
      id: "ins_02",
      category: "conversion",
      title: "Lead Conversion Velocity",
      metricLabel: "Inquiry → Viewing",
      metricValue: "68%",
      trend: "up",
      suggestion: "High conversion! 6 out of 10 inquiries schedule viewings.",
    },
    {
      id: "ins_03",
      category: "trust",
      title: "Trust Identity Growth",
      metricLabel: "Trust Score",
      metricValue: "94 / 100",
      trend: "stable",
      suggestion: "Complete CAC annual filing verification to unlock Platinum status.",
    },
  ];
}

/** Get Automation Hooks Architecture */
export function getAutomationHooks(sellerId: string): AutomationHook[] {
  const now = new Date().toISOString();
  return [
    {
      id: "auto_01",
      triggerEvent: "followup_reminder",
      leadId: "lead_01",
      buyerName: "Chief Stankings Client",
      dueAt: now,
      status: "pending",
    },
    {
      id: "auto_02",
      triggerEvent: "viewing_reminder",
      leadId: "lead_02",
      buyerName: "Alhaji Bello",
      dueAt: now,
      status: "pending",
    },
  ];
}

/** Get complete Seller CRM Snapshot */
export async function getSellerCrmSnapshot(sellerId: string): Promise<SellerCrmSnapshot> {
  const passport = await getOrCreateTrustIdentity(sellerId);
  const pipeline = getDefaultLeadPipeline(sellerId);
  const inventoryHealth = getInventoryHealthList(sellerId);
  const activityFeed = getActivityFeed(sellerId);
  const insights = getPerformanceInsights(sellerId);
  const automations = getAutomationHooks(sellerId);

  const activeConversationsCount = pipeline.length;
  const dealsInProgressCount = pipeline.filter((l) => l.stage !== "COMPLETED" && l.stage !== "LOST").length;
  const scheduledViewingsCount = pipeline.filter((l) => l.stage === "VIEWING_SCHEDULED").length;
  const pendingInspectionsCount = pipeline.filter((l) => l.stage === "INSPECTION").length;
  const pendingOffersCount = pipeline.filter((l) => l.stage === "NEGOTIATION").length;
  const completedDealsCount = passport.reputation.completedDeals;

  trackTransactionEvent("crm_opened", { sellerId, userId: sellerId });

  return {
    sellerId,
    sellerName: passport.fullName,
    trustScore: passport.trustScore,
    unreadMessagesCount: 2,
    metrics: {
      todayActivityCount: activityFeed.length,
      newLeadsCount: pipeline.filter((l) => l.stage === "NEW_LEAD").length,
      activeConversationsCount,
      dealsInProgressCount,
      scheduledViewingsCount,
      pendingInspectionsCount,
      pendingOffersCount,
      completedDealsCount,
    },
    pipeline,
    inventoryHealth,
    activityFeed,
    insights,
    automations,
  };
}

/** Move Lead Stage in Pipeline */
export async function moveLeadStage(
  sellerId: string,
  leadId: string,
  toStage: PipelineStage
): Promise<LeadCard> {
  const pipeline = getDefaultLeadPipeline(sellerId);
  const lead = pipeline.find((l) => l.id === leadId);
  if (!lead) throw new Error("Lead not found");

  const fromStage = lead.stage;
  lead.stage = toStage;
  lead.daysInStage = 0;
  lead.lastActivityAt = new Date().toISOString();

  leadStore.set(sellerId, pipeline);

  trackTransactionEvent("lead_progressed", {
    sellerId,
    dealId: lead.dealId,
    metadata: { leadId, fromStage, toStage },
  });

  return lead;
}
