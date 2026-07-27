/**
 * Conversation Platform & Connect System — Types & Interfaces
 *
 * Governs the 1-per-listing Transaction Conversation Workspace.
 */

export type ConversationStatus =
  | "NEW"
  | "ACTIVE"
  | "NEGOTIATING"
  | "VIEWING_SCHEDULED"
  | "LIVE_WALKTHROUGH_COMPLETED"
  | "INSPECTION_REQUESTED"
  | "INSPECTION_IN_PROGRESS"
  | "INSPECTION_COMPLETED"
  | "OFFER_MADE"
  | "OFFER_ACCEPTED"
  | "DEAL_COMPLETED"
  | "DEAL_CANCELLED"
  | "ARCHIVED";

export type TimelineEventType =
  | "conversation_created"
  | "seller_replied"
  | "message"
  | "viewing_scheduled"
  | "viewing_completed"
  | "live_walkthrough_completed"
  | "offer_submitted"
  | "offer_accepted"
  | "offer_rejected"
  | "inspection_requested"
  | "inspection_started"
  | "inspection_completed"
  | "buyer_assistance_requested"
  | "trust_verification_completed"
  | "deal_completed"
  | "deal_cancelled";

export type TransactionActionType =
  | "schedule_viewing"
  | "request_walkthrough"
  | "request_inspection"
  | "buyer_assistance"
  | "make_offer"
  | "respond_offer"
  | "mark_deal_completed"
  | "cancel_deal"
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
  lastVerifiedDate?: string;
  badges: Array<{
    name: string;
    label: string;
    style: "emerald" | "gold" | "blue" | "navy";
  }>;
  verified: boolean;
};

export type TransactionStateTransition = {
  fromState: ConversationStatus;
  toState: ConversationStatus;
  actorId: string;
  reason?: string;
  timestamp: string;
};

export type OfferStatus = "pending" | "accepted" | "rejected" | "countered" | "withdrawn";

export type OfferRecord = {
  id: string;
  conversationId: string;
  amount: number;
  proposedBy: "buyer" | "seller";
  status: OfferStatus;
  terms?: string;
  createdAt: string;
  updatedAt: string;
};

export type ViewingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export type ViewingRecord = {
  id: string;
  conversationId: string;
  date: string;
  time: string;
  meetingPoint: string;
  notes?: string;
  status: ViewingStatus;
  createdAt: string;
};

export type BuyerAssistanceServiceType =
  | "property_search"
  | "vehicle_search"
  | "negotiation_help"
  | "inspection_coordination"
  | "document_review"
  | "viewing_coordination";

export type BuyerAssistanceRequest = {
  id: string;
  conversationId: string;
  serviceType: BuyerAssistanceServiceType;
  notes?: string;
  createdAt: string;
};

export type InspectionType = "property_50_point" | "vehicle_50_point" | "legal_title_search";

export type InspectionRequestPayload = {
  inspectionType: InspectionType;
  preferredDate: string;
  notes?: string;
  contactPreference: "whatsapp" | "phone" | "email";
};

export type TrustPanelData = {
  identityVerified: boolean;
  businessVerified: boolean;
  inspectionStatus: "none" | "requested" | "in_progress" | "completed";
  trustScore: number;
  lastVerificationDate: string;
  badges: Array<{ name: string; label: string; style: string }>;
  safetyTips: string[];
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
  stateHistory: TransactionStateTransition[];
  scheduledViewingAt?: string | null;
  currentViewing?: ViewingRecord | null;
  currentOffer?: OfferRecord | null;
  offerHistory: OfferRecord[];
  inspectionStatus: "none" | "requested" | "in_progress" | "completed";
  trustPanel: TrustPanelData;
  unreadCount: number;
  createdAt: string;
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
