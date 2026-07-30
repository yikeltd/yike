/**
 * Yike Transaction Workspace Engine — Conversation Intelligence Layer Types
 * Polymorphic transaction stream entry contracts (Messages, System Events, Offers, Inspections, Documents).
 */

import type { BaseEntity, ParticipantRole } from "../types";

export type ConversationItemType =
  | "system_event"
  | "user_message"
  | "offer_card"
  | "inspection_card"
  | "document_card"
  | "verification_card"
  | "timeline_milestone"
  | "call_card"
  | "payment_card"
  | "task_card"
  | "approval_card";

export interface MessageAttachment {
  id: string;
  fileUrl: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
}

export interface ReadReceipt {
  userId: string;
  readAt: string;
}

export interface ConversationItem<TPayload = Record<string, unknown>> extends BaseEntity {
  workspaceId: string;
  itemType: ConversationItemType;
  actorId: string;
  actorRole: ParticipantRole;
  content?: string;
  payload?: TPayload;
  replyToId?: string;
  attachments?: MessageAttachment[];
  readReceipts?: ReadReceipt[];
  pinned: boolean;
  metadata?: Record<string, unknown>;
}
