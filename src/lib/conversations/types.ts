/**
 * Conversation Platform & Connect System — Types & Interfaces
 *
 * Governs the 1-per-listing Transaction Conversation Workspace.
 */

import type { SubscriptionPlanCode } from "@/lib/subscriptions/constants";

export type ConversationStatus =
  | "inquiry"
  | "negotiating"
  | "viewing_scheduled"
  | "inspection_requested"
  | "deal_closed"
  | "archived";

export type TimelineEventType =
  | "conversation_started"
  | "message"
  | "viewing_scheduled"
  | "live_walkthrough_completed"
  | "inspection_requested"
  | "inspection_completed"
  | "buyer_assistance_requested"
  | "offer_submitted"
  | "deal_completed";

export type TransactionActionType =
  | "schedule_viewing"
  | "request_walkthrough"
  | "request_inspection"
  | "buyer_assistance"
  | "make_offer"
  | "mark_deal_completed"
  | "toggle_saved";

export type ConnectChannelType =
  | "whatsapp"
  | "voice_call"
  | "video_call"
  | "phone_call"
  | "schedule_viewing";

export type ListingSummary = {
  id: string;
  title: string;
  slug: string;
  price: number;
  currency: string;
  locationLabel: string;
  imageUrl?: string;
  listingType: "property" | "vehicle";
  status: string;
};

export type SellerProfileSummary = {
  id: string;
  fullName: string;
  avatarUrl?: string;
  role: string;
  phone?: string;
  whatsappPhone?: string;
  trustScore: number;
  badges: Array<{
    name: string;
    label: string;
    style: "emerald" | "gold" | "blue" | "navy";
  }>;
  verified: boolean;
};

export type ConversationTimelineEvent = {
  id: string;
  conversationId: string;
  eventType: TimelineEventType;
  actorId: string;
  actorName: string;
  actorRole: "buyer" | "seller" | "system";
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type ConversationMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  body: string;
  attachments?: Array<{
    url: string;
    type: "image" | "document";
    name: string;
  }>;
  readAt?: string | null;
  createdAt: string;
};

export type ConversationWorkspace = {
  id: string;
  listing: ListingSummary;
  seller: SellerProfileSummary;
  buyerId: string;
  status: ConversationStatus;
  scheduledViewingAt?: string | null;
  inspectionStatus?: "none" | "requested" | "in_progress" | "completed";
  offerAmount?: number | null;
  unreadCount: number;
  lastMessageAt: string;
  timeline: ConversationTimelineEvent[];
  messages: ConversationMessage[];
  availableActions: TransactionActionType[];
  availableConnectChannels: ConnectChannelType[];
};

export type ConnectChannelOption = {
  id: ConnectChannelType;
  label: string;
  sublabel: string;
  iconName: string;
  enabled: boolean;
  requiresFlag?: string;
  href?: string;
  action?: TransactionActionType;
};
