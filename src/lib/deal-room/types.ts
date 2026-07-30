/**
 * Yike Deal Room Platform — Domain Model & Types
 * Enterprise-grade, provider-agnostic transaction workspace architecture.
 */

export type DealRoomStatus =
  | "lead_created"
  | "buyer_interested"
  | "seller_responded"
  | "negotiation"
  | "inspection_requested"
  | "inspection_scheduled"
  | "inspection_completed"
  | "documents_shared"
  | "offer_sent"
  | "offer_accepted"
  | "payment_pending"
  | "completed"
  | "archived"
  | "cancelled";

export type ParticipantRole =
  | "buyer"
  | "seller"
  | "agent"
  | "agency_manager"
  | "enterprise_staff"
  | "inspector"
  | "administrator"
  | "moderator";

export type ParticipantStatus = "active" | "invited" | "left" | "blocked";

export interface DealParticipant {
  id: string;
  dealRoomId: string;
  userId: string;
  role: ParticipantRole;
  status: ParticipantStatus;
  joinedAt: string;
  lastActiveAt?: string;
  metadata?: Record<string, unknown>;
}

export type TimelineEventType =
  | "room_created"
  | "participant_joined"
  | "participant_left"
  | "message_sent"
  | "offer_created"
  | "offer_countered"
  | "offer_accepted"
  | "offer_rejected"
  | "inspection_requested"
  | "inspection_scheduled"
  | "inspection_completed"
  | "document_uploaded"
  | "document_verified"
  | "voice_call_started"
  | "voice_call_ended"
  | "video_call_started"
  | "video_call_ended"
  | "payment_initiated"
  | "payment_completed"
  | "deal_completed"
  | "deal_cancelled"
  | "custom_event";

export interface TimelineEvent {
  id: string;
  dealRoomId: string;
  actorId: string;
  actorRole: ParticipantRole;
  type: TimelineEventType;
  title: string;
  description?: string;
  payload?: Record<string, unknown>;
  createdAt: string;
}

export interface DealRoom {
  id: string;
  listingId: string;
  listingType: "vehicle" | "property" | "equipment" | "project";
  listingTitle: string;
  listingPrice: number;
  currency: "NGN" | "USD";
  status: DealRoomStatus;
  buyerId: string;
  sellerId: string;
  participants: DealParticipant[];
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  metadata?: Record<string, unknown>;
}
