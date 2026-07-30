/**
 * Yike Transaction Workspace Engine (Deal Room Platform)
 * Hardened Domain Models, Universal Ownership, & Entity Framework
 */

export type EntityStatus = "active" | "archived" | "deleted";

export interface OwnershipMetadata {
  createdBy: string;
  updatedBy?: string;
  deletedBy?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  version: number;
  status: EntityStatus;
}

export interface BaseEntity extends OwnershipMetadata {
  id: string;
}

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

export interface DealParticipant extends BaseEntity {
  dealRoomId: string;
  userId: string;
  role: ParticipantRole;
  participantStatus: ParticipantStatus;
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

export interface TimelineEvent extends BaseEntity {
  dealRoomId: string;
  actorId: string;
  actorRole: ParticipantRole;
  type: TimelineEventType;
  title: string;
  description?: string;
  payload?: Record<string, unknown>;
  eventVersion: number;
  schemaVersion: number;
  source: string;
  correlationId: string;
  causationId?: string;
}

/**
 * Internal Domain Concept: TransactionWorkspace (Exposed as DealRoom in UI)
 */
export interface TransactionWorkspace extends BaseEntity {
  listingId: string;
  listingType: "vehicle" | "property" | "equipment" | "project";
  listingTitle: string;
  listingPrice: number;
  currency: "NGN" | "USD";
  workspaceStatus: DealRoomStatus;
  buyerId: string;
  sellerId: string;
  participants: DealParticipant[];
  closedAt?: string;
  metadata?: Record<string, unknown>;
}

// Backward compatibility alias for UI & API layers
export type DealRoom = TransactionWorkspace;
