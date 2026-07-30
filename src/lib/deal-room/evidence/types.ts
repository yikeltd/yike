/**
 * Yike Transaction Workspace Engine — Enterprise Evidence Platform Types
 * Immutable proof aggregates, chain of custody tracking, & version history.
 */

import type { BaseEntity, ParticipantRole } from "../types";

export type EvidenceType =
  | "pdf"
  | "image"
  | "video"
  | "audio"
  | "voice_recording"
  | "inspection_photo"
  | "drone_image"
  | "gps_location"
  | "digital_signature"
  | "certificate"
  | "title_document"
  | "vehicle_registration"
  | "invoice"
  | "receipt"
  | "insurance"
  | "identity_document"
  | "custom";

export type EvidenceStatus =
  | "uploaded"
  | "pending_review"
  | "verified"
  | "rejected"
  | "expired"
  | "archived"
  | "replaced";

export type PolymorphicOwnerType =
  | "verification"
  | "inspection"
  | "negotiation"
  | "appointment"
  | "transaction"
  | "conversation_item"
  | "message"
  | "offer";

export interface ChainOfCustodyRecord {
  action: "uploaded" | "reviewed" | "verified" | "replaced" | "archived";
  actorId: string;
  actorRole: ParticipantRole;
  timestamp: string;
  hash?: string;
  notes?: string;
}

export interface EvidenceVersion {
  versionNumber: number;
  fileUrl: string;
  fileSizeBytes: number;
  mimeType: string;
  uploadedBy: string;
  uploadedRole: ParticipantRole;
  createdAt: string;
  hash?: string;
}

export interface EvidenceAggregate extends BaseEntity {
  workspaceId: string;
  ownerType: PolymorphicOwnerType;
  ownerId: string;
  evidenceType: EvidenceType;
  title: string;
  description?: string;
  evidenceStatus: EvidenceStatus;
  currentVersionNumber: number;
  versions: EvidenceVersion[];
  chainOfCustody: ChainOfCustodyRecord[];
  verificationId?: string;
  metadata?: Record<string, unknown>;
}
