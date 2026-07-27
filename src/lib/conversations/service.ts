/**
 * Conversation Domain Service — Phase 1.1 Transaction State Machine & Core
 */

import { trackTransactionEvent } from "@/lib/analytics/index";
import { isFeatureEnabled } from "@/lib/feature-flags/index";
import type {
  BuyerAssistanceRequest,
  BuyerAssistanceServiceType,
  ConnectChannelOption,
  ConnectChannelType,
  ConversationMessage,
  ConversationStatus,
  ConversationTimelineEvent,
  ConversationWorkspace,
  InspectionRequestPayload,
  InspectionType,
  ListingSummary,
  OfferRecord,
  OfferStatus,
  SellerProfileSummary,
  TransactionActionType,
  TrustPanelData,
  ViewingRecord,
} from "./types";

// In-memory workspace store fallback for robust development & API fallback
const memoryWorkspaceStore = new Map<string, ConversationWorkspace>();

/** Valid State Transition Rules */
const VALID_TRANSITIONS: Record<ConversationStatus, ConversationStatus[]> = {
  NEW: ["ACTIVE", "NEGOTIATING", "VIEWING_SCHEDULED", "LIVE_WALKTHROUGH_COMPLETED", "INSPECTION_REQUESTED", "OFFER_MADE", "ARCHIVED"],
  ACTIVE: ["NEGOTIATING", "VIEWING_SCHEDULED", "LIVE_WALKTHROUGH_COMPLETED", "INSPECTION_REQUESTED", "OFFER_MADE", "DEAL_COMPLETED", "DEAL_CANCELLED", "ARCHIVED"],
  NEGOTIATING: ["OFFER_MADE", "OFFER_ACCEPTED", "VIEWING_SCHEDULED", "INSPECTION_REQUESTED", "DEAL_COMPLETED", "DEAL_CANCELLED", "ARCHIVED"],
  VIEWING_SCHEDULED: ["LIVE_WALKTHROUGH_COMPLETED", "NEGOTIATING", "OFFER_MADE", "INSPECTION_REQUESTED", "DEAL_COMPLETED", "DEAL_CANCELLED", "ARCHIVED"],
  LIVE_WALKTHROUGH_COMPLETED: ["NEGOTIATING", "VIEWING_SCHEDULED", "OFFER_MADE", "INSPECTION_REQUESTED", "DEAL_COMPLETED", "DEAL_CANCELLED", "ARCHIVED"],
  INSPECTION_REQUESTED: ["INSPECTION_IN_PROGRESS", "INSPECTION_COMPLETED", "OFFER_MADE", "NEGOTIATING", "DEAL_CANCELLED", "ARCHIVED"],
  INSPECTION_IN_PROGRESS: ["INSPECTION_COMPLETED", "DEAL_CANCELLED", "ARCHIVED"],
  INSPECTION_COMPLETED: ["OFFER_MADE", "OFFER_ACCEPTED", "NEGOTIATING", "DEAL_COMPLETED", "DEAL_CANCELLED", "ARCHIVED"],
  OFFER_MADE: ["OFFER_ACCEPTED", "NEGOTIATING", "INSPECTION_REQUESTED", "DEAL_COMPLETED", "DEAL_CANCELLED", "ARCHIVED"],
  OFFER_ACCEPTED: ["DEAL_COMPLETED", "INSPECTION_REQUESTED", "DEAL_CANCELLED", "ARCHIVED"],
  DEAL_COMPLETED: ["ARCHIVED"],
  DEAL_CANCELLED: ["ARCHIVED"],
  ARCHIVED: ["ACTIVE"],
};

export function validateStateTransition(current: ConversationStatus, next: ConversationStatus): boolean {
  if (current === next) return true;
  const allowed = VALID_TRANSITIONS[current] || [];
  return allowed.includes(next);
}

export function buildFallbackListingSummary(listingId: string): ListingSummary {
  return {
    id: listingId,
    title: "Luxury 4 Bedroom Terrace Villa with Swimming Pool",
    slug: "luxury-4-bedroom-terrace-villa-lekki",
    price: 135000000,
    currency: "NGN",
    locationLabel: "Lekki Phase 1, Lagos",
    imageUrl: "/images/logo.webp",
    listingType: "property",
    status: "active",
  };
}

export function buildFallbackSellerProfile(sellerId: string): SellerProfileSummary {
  return {
    id: sellerId,
    fullName: "Chief Stankings Properties",
    avatarUrl: "/images/logo.webp",
    role: "Verified Estate Developer",
    phone: "+2348012345678",
    whatsappPhone: "2348012345678",
    trustScore: 94,
    lastVerifiedDate: "2026-07-20",
    badges: [
      { name: "verified_business", label: "CAC Verified", style: "gold" },
      { name: "yike_inspected", label: "Inspected", style: "emerald" },
    ],
    verified: true,
  };
}

export function buildFallbackTrustPanel(): TrustPanelData {
  return {
    identityVerified: true,
    businessVerified: true,
    inspectionStatus: "completed",
    trustScore: 94,
    lastVerificationDate: "2026-07-20",
    badges: [
      { name: "verified_individual", label: "NIN Verified", style: "blue" },
      { name: "verified_business", label: "CAC Verified", style: "gold" },
      { name: "yike_inspected", label: "Yike Inspected", style: "emerald" },
    ],
    safetyTips: [
      "Never make payment before physical or video inspection.",
      "Verify seller identity and CAC credentials in Trust Panel.",
      "Schedule meetings in public, verified locations.",
      "Use official Yike Field Inspection & Title Search services.",
    ],
  };
}

/** Get or create 1-per-listing conversation workspace for buyer */
export async function getOrCreateConversationWorkspace(
  listingId: string,
  buyerId: string
): Promise<ConversationWorkspace> {
  const compositeKey = `${listingId}:${buyerId}`;
  const existing = memoryWorkspaceStore.get(compositeKey);
  if (existing) return existing;

  const listing = buildFallbackListingSummary(listingId);
  const seller = buildFallbackSellerProfile("seller_01");
  const trustPanel = buildFallbackTrustPanel();
  const now = new Date().toISOString();

  const initialTimeline: ConversationTimelineEvent[] = [
    {
      id: `evt_${Date.now()}_1`,
      conversationId: compositeKey,
      eventType: "conversation_created",
      actorId: buyerId,
      actorName: "Buyer",
      actorRole: "buyer",
      title: "Conversation Created",
      description: "Buyer started transaction inquiry.",
      createdAt: now,
    },
  ];

  const initialMessages: ConversationMessage[] = [
    {
      id: `msg_${Date.now()}_1`,
      conversationId: compositeKey,
      senderId: buyerId,
      senderName: "Buyer",
      body: "Hello! Is this property still available for inspection this weekend?",
      createdAt: now,
    },
  ];

  const availableActions: TransactionActionType[] = [
    "schedule_viewing",
    "request_walkthrough",
    "request_inspection",
    "buyer_assistance",
    "make_offer",
    "mark_deal_completed",
  ];

  const availableConnectChannels: ConnectChannelType[] = [
    "whatsapp",
    "voice_call",
    "phone_call",
    "schedule_viewing",
  ];
  if (isFeatureEnabled("video_call_beta")) {
    availableConnectChannels.push("video_call");
  }

  const workspace: ConversationWorkspace = {
    id: compositeKey,
    listing,
    seller,
    buyerId,
    status: "NEW",
    stateHistory: [{ fromState: "NEW", toState: "NEW", actorId: buyerId, timestamp: now }],
    currentViewing: null,
    currentOffer: null,
    offerHistory: [],
    inspectionStatus: "none",
    trustPanel,
    unreadCount: 0,
    createdAt: now,
    lastMessageAt: now,
    timeline: initialTimeline,
    messages: initialMessages,
    availableActions,
    availableConnectChannels,
  };

  trackTransactionEvent("conversation_created", {
    conversationId: compositeKey,
    listingId,
    actorId: buyerId,
  });

  memoryWorkspaceStore.set(compositeKey, workspace);
  return workspace;
}

/** Get detailed conversation workspace by ID */
export async function getConversationWorkspaceById(
  conversationId: string,
  userId: string
): Promise<ConversationWorkspace | null> {
  let workspace = memoryWorkspaceStore.get(conversationId);
  if (!workspace) {
    const parts = conversationId.split(":");
    const listingId = parts[0] ?? "lst_default";
    const buyerId = parts[1] ?? userId;
    workspace = await getOrCreateConversationWorkspace(listingId, buyerId);
  }
  return workspace;
}

/** List all conversation workspaces for user */
export async function listUserConversations(userId: string): Promise<ConversationWorkspace[]> {
  const all = Array.from(memoryWorkspaceStore.values());
  if (all.length === 0) {
    const defaultWs = await getOrCreateConversationWorkspace("prop_lekki_01", userId);
    return [defaultWs];
  }
  return all.filter((ws) => ws.buyerId === userId || ws.seller.id === userId);
}

/** Transition conversation state cleanly */
export function transitionWorkspaceState(
  workspace: ConversationWorkspace,
  nextState: ConversationStatus,
  actorId: string,
  reason?: string
): void {
  if (!validateStateTransition(workspace.status, nextState)) {
    throw new Error(`Invalid transition from ${workspace.status} to ${nextState}`);
  }

  const now = new Date().toISOString();
  workspace.stateHistory.push({
    fromState: workspace.status,
    toState: nextState,
    actorId,
    reason,
    timestamp: now,
  });
  workspace.status = nextState;
}

/** Post a new message into the conversation workspace */
export async function postConversationMessage(
  conversationId: string,
  senderId: string,
  senderName: string,
  body: string
): Promise<ConversationMessage> {
  const workspace = await getConversationWorkspaceById(conversationId, senderId);
  if (!workspace) throw new Error("Conversation not found");

  const now = new Date().toISOString();
  const message: ConversationMessage = {
    id: `msg_${Date.now()}`,
    conversationId,
    senderId,
    senderName,
    body,
    createdAt: now,
  };

  workspace.messages.push(message);
  workspace.lastMessageAt = now;

  if (workspace.status === "NEW") {
    transitionWorkspaceState(workspace, "ACTIVE", senderId, "First message posted");
  }

  const eventType = senderId === workspace.buyerId ? "message" : "seller_replied";
  workspace.timeline.push({
    id: `evt_${Date.now()}`,
    conversationId,
    eventType,
    actorId: senderId,
    actorName: senderName,
    actorRole: senderId === workspace.buyerId ? "buyer" : "seller",
    title: senderId === workspace.buyerId ? "Buyer Message" : "Seller Replied",
    description: body,
    createdAt: now,
  });

  trackTransactionEvent("message_sent", { conversationId, actorId: senderId });
  memoryWorkspaceStore.set(conversationId, workspace);
  return message;
}

/** Submit or update Offer */
export async function submitOffer(
  conversationId: string,
  actorId: string,
  actorName: string,
  amount: number,
  terms?: string
): Promise<OfferRecord> {
  const workspace = await getConversationWorkspaceById(conversationId, actorId);
  if (!workspace) throw new Error("Conversation not found");

  const now = new Date().toISOString();
  const offer: OfferRecord = {
    id: `off_${Date.now()}`,
    conversationId,
    amount,
    proposedBy: actorId === workspace.buyerId ? "buyer" : "seller",
    status: "pending",
    terms,
    createdAt: now,
    updatedAt: now,
  };

  workspace.currentOffer = offer;
  workspace.offerHistory.push(offer);
  transitionWorkspaceState(workspace, "OFFER_MADE", actorId, "Offer submitted");

  workspace.timeline.push({
    id: `evt_${Date.now()}`,
    conversationId,
    eventType: "offer_submitted",
    actorId,
    actorName,
    actorRole: actorId === workspace.buyerId ? "buyer" : "seller",
    title: "Offer Submitted",
    description: `Submitted offer of ₦${amount.toLocaleString()}${terms ? ` · ${terms}` : ""}`,
    metadata: { amount, terms },
    createdAt: now,
  });

  trackTransactionEvent("offer_created", { conversationId, actorId, metadata: { amount } });
  memoryWorkspaceStore.set(conversationId, workspace);
  return offer;
}

/** Respond to existing Offer (accept, reject, counter) */
export async function respondToOffer(
  conversationId: string,
  actorId: string,
  actorName: string,
  status: OfferStatus,
  counterAmount?: number
): Promise<OfferRecord> {
  const workspace = await getConversationWorkspaceById(conversationId, actorId);
  if (!workspace || !workspace.currentOffer) throw new Error("No active offer found");

  const now = new Date().toISOString();
  workspace.currentOffer.status = status;
  workspace.currentOffer.updatedAt = now;

  if (status === "accepted") {
    transitionWorkspaceState(workspace, "OFFER_ACCEPTED", actorId, "Offer accepted");
    workspace.timeline.push({
      id: `evt_${Date.now()}`,
      conversationId,
      eventType: "offer_accepted",
      actorId,
      actorName,
      actorRole: actorId === workspace.buyerId ? "buyer" : "seller",
      title: "Offer Accepted",
      description: `Offer of ₦${workspace.currentOffer.amount.toLocaleString()} was accepted!`,
      createdAt: now,
    });
    trackTransactionEvent("offer_accepted", { conversationId, actorId });
  } else if (status === "rejected") {
    workspace.timeline.push({
      id: `evt_${Date.now()}`,
      conversationId,
      eventType: "offer_rejected",
      actorId,
      actorName,
      actorRole: actorId === workspace.buyerId ? "buyer" : "seller",
      title: "Offer Declined",
      description: "Offer was declined.",
      createdAt: now,
    });
  } else if (status === "countered" && counterAmount) {
    await submitOffer(conversationId, actorId, actorName, counterAmount, "Counter offer");
  }

  memoryWorkspaceStore.set(conversationId, workspace);
  return workspace.currentOffer;
}

/** Request or schedule Viewing */
export async function requestViewing(
  conversationId: string,
  actorId: string,
  actorName: string,
  date: string,
  time: string,
  meetingPoint: string,
  notes?: string
): Promise<ViewingRecord> {
  const workspace = await getConversationWorkspaceById(conversationId, actorId);
  if (!workspace) throw new Error("Conversation not found");

  const now = new Date().toISOString();
  const viewing: ViewingRecord = {
    id: `vw_${Date.now()}`,
    conversationId,
    date,
    time,
    meetingPoint,
    notes,
    status: "confirmed",
    createdAt: now,
  };

  workspace.currentViewing = viewing;
  transitionWorkspaceState(workspace, "VIEWING_SCHEDULED", actorId, "Viewing scheduled");

  workspace.timeline.push({
    id: `evt_${Date.now()}`,
    conversationId,
    eventType: "viewing_scheduled",
    actorId,
    actorName,
    actorRole: "buyer",
    title: "Viewing Scheduled",
    description: `Appointment for ${date} at ${time} at ${meetingPoint}`,
    metadata: { date, time, meetingPoint },
    createdAt: now,
  });

  trackTransactionEvent("viewing_requested", { conversationId, actorId, metadata: { date, time } });
  memoryWorkspaceStore.set(conversationId, workspace);
  return viewing;
}

/** Submit Field Inspection Request */
export async function submitInspectionRequest(
  conversationId: string,
  actorId: string,
  actorName: string,
  payload: InspectionRequestPayload
): Promise<ConversationWorkspace> {
  const workspace = await getConversationWorkspaceById(conversationId, actorId);
  if (!workspace) throw new Error("Conversation not found");

  const now = new Date().toISOString();
  workspace.inspectionStatus = "requested";
  transitionWorkspaceState(workspace, "INSPECTION_REQUESTED", actorId, "Inspection ordered");

  workspace.timeline.push({
    id: `evt_${Date.now()}`,
    conversationId,
    eventType: "inspection_requested",
    actorId,
    actorName,
    actorRole: "buyer",
    title: "Inspection Ordered",
    description: `Ordered ${payload.inspectionType.replace(/_/g, " ")} for ${payload.preferredDate}`,
    metadata: { ...payload },
    createdAt: now,
  });

  trackTransactionEvent("inspection_requested", { conversationId, actorId });
  memoryWorkspaceStore.set(conversationId, workspace);
  return workspace;
}

/** Engage Buyer Assistance Concierge */
export async function engageBuyerAssistance(
  conversationId: string,
  actorId: string,
  actorName: string,
  serviceType: BuyerAssistanceServiceType,
  notes?: string
): Promise<BuyerAssistanceRequest> {
  const workspace = await getConversationWorkspaceById(conversationId, actorId);
  if (!workspace) throw new Error("Conversation not found");

  const now = new Date().toISOString();
  const req: BuyerAssistanceRequest = {
    id: `ba_${Date.now()}`,
    conversationId,
    serviceType,
    notes,
    createdAt: now,
  };

  workspace.timeline.push({
    id: `evt_${Date.now()}`,
    conversationId,
    eventType: "buyer_assistance_requested",
    actorId,
    actorName,
    actorRole: "buyer",
    title: "Buyer Assistance Requested",
    description: `Concierge requested for ${serviceType.replace(/_/g, " ")}`,
    metadata: { serviceType, notes },
    createdAt: now,
  });

  trackTransactionEvent("buyer_assistance_requested", { conversationId, actorId });
  memoryWorkspaceStore.set(conversationId, workspace);
  return req;
}

/** Execute Transaction Action */
export async function executeConversationAction(
  conversationId: string,
  actorId: string,
  actorName: string,
  action: TransactionActionType,
  payload?: Record<string, unknown>
): Promise<ConversationWorkspace> {
  const workspace = await getConversationWorkspaceById(conversationId, actorId);
  if (!workspace) throw new Error("Conversation not found");

  const now = new Date().toISOString();

  switch (action) {
    case "schedule_viewing": {
      const date = (payload?.date as string) || "2026-08-01";
      const time = (payload?.time as string) || "2:00 PM";
      const meetingPoint = (payload?.meetingPoint as string) || "Property Site Entrance";
      await requestViewing(conversationId, actorId, actorName, date, time, meetingPoint);
      break;
    }
    case "make_offer": {
      const amount = (payload?.amount as number) || 130000000;
      const terms = payload?.terms as string | undefined;
      await submitOffer(conversationId, actorId, actorName, amount, terms);
      break;
    }
    case "request_inspection": {
      await submitInspectionRequest(conversationId, actorId, actorName, {
        inspectionType: (payload?.inspectionType as InspectionType) || "property_50_point",
        preferredDate: (payload?.preferredDate as string) || "2026-08-02",
        contactPreference: "whatsapp",
      });
      break;
    }
    case "buyer_assistance": {
      await engageBuyerAssistance(
        conversationId,
        actorId,
        actorName,
        (payload?.serviceType as BuyerAssistanceServiceType) || "property_search"
      );
      break;
    }
    case "mark_deal_completed": {
      transitionWorkspaceState(workspace, "DEAL_COMPLETED", actorId, "Marked completed");
      workspace.timeline.push({
        id: `evt_${Date.now()}`,
        conversationId,
        eventType: "deal_completed",
        actorId,
        actorName,
        actorRole: "seller",
        title: "Deal Completed",
        description: "Transaction successfully closed.",
        createdAt: now,
      });
      trackTransactionEvent("deal_completed", { conversationId, actorId });
      break;
    }
    case "cancel_deal": {
      transitionWorkspaceState(workspace, "DEAL_CANCELLED", actorId, "Deal cancelled");
      workspace.timeline.push({
        id: `evt_${Date.now()}`,
        conversationId,
        eventType: "deal_cancelled",
        actorId,
        actorName,
        actorRole: actorId === workspace.buyerId ? "buyer" : "seller",
        title: "Deal Cancelled",
        description: "Transaction was cancelled.",
        createdAt: now,
      });
      trackTransactionEvent("deal_cancelled", { conversationId, actorId });
      break;
    }
  }

  workspace.lastMessageAt = now;
  memoryWorkspaceStore.set(conversationId, workspace);
  return workspace;
}

export function getConnectChannelOptions(
  workspace: ConversationWorkspace
): ConnectChannelOption[] {
  const options: ConnectChannelOption[] = [
    {
      id: "whatsapp",
      label: "WhatsApp Direct",
      sublabel: "Instant messaging & media sharing",
      iconName: "MessageCircle",
      enabled: isFeatureEnabled("whatsapp_connect"),
      href: workspace.seller.whatsappPhone
        ? `https://wa.me/${workspace.seller.whatsappPhone}?text=${encodeURIComponent(
            `Hello, I am inquiring about listing: ${workspace.listing.title}`
          )}`
        : undefined,
    },
    {
      id: "phone_call",
      label: "Direct Phone Call",
      sublabel: "Speak with verified seller immediately",
      iconName: "Phone",
      enabled: Boolean(workspace.seller.phone),
      href: workspace.seller.phone ? `tel:${workspace.seller.phone}` : undefined,
    },
    {
      id: "voice_call",
      label: "In-App Voice Call",
      sublabel: "Free secure in-app voice connect",
      iconName: "PhoneCall",
      enabled: isFeatureEnabled("voice_call_beta"),
    },
    {
      id: "video_call",
      label: "Live Video Walkthrough",
      sublabel: "1-on-1 virtual property tour",
      iconName: "Video",
      enabled: isFeatureEnabled("video_call_beta"),
      action: "request_walkthrough",
    },
    {
      id: "schedule_viewing",
      label: "Schedule Viewing",
      sublabel: "Set formal inspection date & time",
      iconName: "Calendar",
      enabled: true,
      action: "schedule_viewing",
    },
  ];

  return options;
}
