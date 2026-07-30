/**
 * Yike Transaction Workspace Engine — Universal Comment Engine
 * Contextual annotation framework for offers, inspections, documents, & tasks.
 */

import type { BaseEntity } from "./types";

export type CommentOwnerType =
  | "offer"
  | "inspection"
  | "document"
  | "timeline_event"
  | "task"
  | "transaction";

export interface UniversalComment extends BaseEntity {
  workspaceId: string;
  ownerType: CommentOwnerType;
  ownerId: string;
  authorId: string;
  authorRole: string;
  content: string;
  parentCommentId?: string;
  metadata?: Record<string, unknown>;
}

class CommentService {
  private comments: Map<string, UniversalComment> = new Map();

  addComment(
    workspaceId: string,
    ownerType: CommentOwnerType,
    ownerId: string,
    authorId: string,
    authorRole: string,
    content: string,
    parentCommentId?: string
  ): UniversalComment {
    const now = new Date().toISOString();
    const id = `cmt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const comment: UniversalComment = {
      id,
      workspaceId,
      ownerType,
      ownerId,
      authorId,
      authorRole,
      content,
      parentCommentId,
      createdBy: authorId,
      createdAt: now,
      updatedAt: now,
      version: 1,
      status: "active",
    };

    this.comments.set(id, comment);
    return comment;
  }

  getByOwner(ownerType: CommentOwnerType, ownerId: string): UniversalComment[] {
    return Array.from(this.comments.values()).filter(
      (c) => c.ownerType === ownerType && c.ownerId === ownerId && c.status === "active"
    );
  }

  softDelete(commentId: string, deletedBy: string): void {
    const cmt = this.comments.get(commentId);
    if (cmt) {
      cmt.status = "deleted";
      cmt.deletedBy = deletedBy;
      cmt.deletedAt = new Date().toISOString();
      cmt.updatedAt = new Date().toISOString();
      cmt.version += 1;
    }
  }

  restore(commentId: string, restoredBy: string): void {
    const cmt = this.comments.get(commentId);
    if (cmt) {
      cmt.status = "active";
      cmt.updatedBy = restoredBy;
      cmt.updatedAt = new Date().toISOString();
      cmt.version += 1;
    }
  }
}

export const commentService = new CommentService();
