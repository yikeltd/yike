/**
 * Conversation Domain Service — Phase 1.0 Transaction Workspace Core
 *
 * Implements 1-per-listing Transaction Workspace logic, timeline event appending,
 * messages, and transaction actions.
 */

import { isFeatureEnabled } from "@/lib/feature-flags/index";
import type {
  ConnectChannelOption,
  ConnectChannelType,
  ConversationMessage,
  ConversationStatus,
  ConversationTimelineEvent,
  ConversationWorkspace,
  ListingSummary,
  SellerProfileSummary,
  TimelineEventType,
  TransactionActionType,
} from "./types";

// In-memory workspace store fallback for robust development & API fallback
const memoryWorkspaceStore = new Map<string, ConversationWorkspace>();

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
    badges: [
      { name: "verified_business", label: "CAC Verified", style: "gold" },
      { name: "yike_inspected", label: "Inspected", style: "emerald" },
    ],
    verified: true,
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
  const now = new Date().toISOString();

  const initialTimeline: ConversationTimelineEvent[] = [
    {
      id: `evt_${Date.now()}_1`,
      conversationId: compositeKey,
      eventType: "conversation_started",
      actorId: buyerId,
      actorName: "Buyer",
      actorRole: "buyer",
      title: "Inquiry Started",
      description: "Buyer initiated contact on listing.",
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
    status: "inquiry",
    scheduledViewingAt: null,
    inspectionStatus: "none",
    offerAmount: null,
    unreadCount: 0,
    lastMessageAt: now,
    timeline: initialTimeline,
    messages: initialMessages,
    availableActions,
    availableConnectChannels,
  };

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

  // Add message event to timeline
  workspace.timeline.push({
    id: `evt_${Date.now()}`,
    conversationId,
    eventType: "message",
    actorId: senderId,
    actorName: senderName,
    actorRole: senderId === workspace.buyerId ? "buyer" : "seller",
    title: senderId === workspace.buyerId ? "Buyer Message" : "Seller Response",
    description: body,
    createdAt: now,
  });

  memoryWorkspaceStore.set(conversationId, workspace);
  return message;
}

/** Execute transaction action within the conversation workspace */
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
      const dateStr = (payload?.date as string) || "Saturday 2:00 PM";
      workspace.scheduledViewingAt = dateStr;
      workspace.status = "viewing_scheduled";
      workspace.timeline.push({
        id: `evt_${Date.now()}`,
        conversationId,
        eventType: "viewing_scheduled",
        actorId,
        actorName,
        actorRole: "buyer",
        title: "Viewing Scheduled",
        description: `Viewing appointment set for ${dateStr}`,
        metadata: { dateStr },
        createdAt: now,
      });
      break;
    }
    case "request_walkthrough": {
      workspace.timeline.push({
        id: `evt_${Date.now()}`,
        conversationId,
        eventType: "live_walkthrough_completed",
        actorId,
        actorName,
        actorRole: "buyer",
        title: "Live Walkthrough Requested",
        description: "Buyer requested a live video walkthrough.",
        createdAt: now,
      });
      break;
    }
    case "request_inspection": {
      workspace.inspectionStatus = "requested";
      workspace.status = "inspection_requested";
      workspace.timeline.push({
        id: `evt_${Date.now()}`,
        conversationId,
        eventType: "inspection_requested",
        actorId,
        actorName,
        actorRole: "buyer",
        title: "Field Inspection Ordered",
        description: "Official 50-Point Property Field Inspection requested.",
        createdAt: now,
      });
      break;
    }
    case "buyer_assistance": {
      workspace.timeline.push({
        id: `evt_${Date.now()}`,
        conversationId,
        eventType: "buyer_assistance_requested",
        actorId,
        actorName,
        actorRole: "buyer",
        title: "Buyer Assistance Engaged",
        description: "Yike Concierge assigned to assist with transaction.",
        createdAt: now,
      });
      break;
    }
    case "make_offer": {
      const amount = (payload?.amount as number) || 130000000;
      workspace.offerAmount = amount;
      workspace.status = "negotiating";
      workspace.timeline.push({
        id: `evt_${Date.now()}`,
        conversationId,
        eventType: "offer_submitted",
        actorId,
        actorName,
        actorRole: "buyer",
        title: "Offer Submitted",
        description: `Submitted offer of ₦${amount.toLocaleString()}`,
        metadata: { amount },
        createdAt: now,
      });
      break;
    }
    case "mark_deal_completed": {
      workspace.status = "deal_closed";
      workspace.timeline.push({
        id: `evt_${Date.now()}`,
        conversationId,
        eventType: "deal_completed",
        actorId,
        actorName,
        actorRole: "seller",
        title: "Deal Completed",
        description: "Transaction closed and asset marked complete.",
        createdAt: now,
      });
      break;
    }
  }

  workspace.lastMessageAt = now;
  memoryWorkspaceStore.set(conversationId, workspace);
  return workspace;
}

/** Get formatted Connect Channel options based on feature flags */
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
