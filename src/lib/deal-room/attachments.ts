/**
 * Yike Transaction Workspace Engine — Universal Attachment Engine
 * Polymorphic attachment framework for offers, inspections, messages, documents, & transactions.
 */

import type { BaseEntity } from "./types";

export type AttachmentOwnerType =
  | "message"
  | "offer"
  | "inspection"
  | "document"
  | "timeline_event"
  | "task"
  | "transaction"
  | "comment";

export interface UniversalAttachment extends BaseEntity {
  workspaceId: string;
  ownerType: AttachmentOwnerType;
  ownerId: string;
  fileName: string;
  fileUrl: string;
  fileSizeBytes: number;
  mimeType: string;
  metadata?: Record<string, unknown>;
}

class AttachmentService {
  private attachments: Map<string, UniversalAttachment> = new Map();

  attach(
    workspaceId: string,
    ownerType: AttachmentOwnerType,
    ownerId: string,
    fileName: string,
    fileUrl: string,
    fileSizeBytes: number,
    mimeType: string,
    uploadedBy: string,
    metadata?: Record<string, unknown>
  ): UniversalAttachment {
    const now = new Date().toISOString();
    const id = `att_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const attachment: UniversalAttachment = {
      id,
      workspaceId,
      ownerType,
      ownerId,
      fileName,
      fileUrl,
      fileSizeBytes,
      mimeType,
      metadata,
      createdBy: uploadedBy,
      createdAt: now,
      updatedAt: now,
      version: 1,
      status: "active",
    };

    this.attachments.set(id, attachment);
    return attachment;
  }

  getByOwner(ownerType: AttachmentOwnerType, ownerId: string): UniversalAttachment[] {
    return Array.from(this.attachments.values()).filter(
      (a) => a.ownerType === ownerType && a.ownerId === ownerId && a.status === "active"
    );
  }

  softDelete(attachmentId: string, deletedBy: string): void {
    const att = this.attachments.get(attachmentId);
    if (att) {
      att.status = "deleted";
      att.deletedBy = deletedBy;
      att.deletedAt = new Date().toISOString();
      att.updatedAt = new Date().toISOString();
      att.version += 1;
    }
  }

  restore(attachmentId: string, restoredBy: string): void {
    const att = this.attachments.get(attachmentId);
    if (att) {
      att.status = "active";
      att.updatedBy = restoredBy;
      att.updatedAt = new Date().toISOString();
      att.version += 1;
    }
  }
}

export const attachmentService = new AttachmentService();
