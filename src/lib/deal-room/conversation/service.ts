/**
 * Yike Transaction Workspace Engine — Conversation Intelligence Service
 * Pure service boundary managing the intelligent chronological transaction stream.
 */

import type { ParticipantRole } from "../types";
import type { ConversationItem, ConversationItemType, MessageAttachment } from "./types";
import { dealRoomEvents } from "../events";
import { auditLogService } from "../audit";
import { automationHooks } from "../hooks";
import { workspaceSearchIndex } from "../search";

class ConversationRepository {
  private items: Map<string, ConversationItem> = new Map();

  save(item: ConversationItem): void {
    this.items.set(item.id, item);
  }

  getById(id: string): ConversationItem | undefined {
    const item = this.items.get(id);
    return item && item.status === "active" ? item : undefined;
  }

  getByWorkspace(workspaceId: string): ConversationItem[] {
    return Array.from(this.items.values())
      .filter((i) => i.workspaceId === workspaceId && i.status === "active")
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  getPinned(workspaceId: string): ConversationItem[] {
    return this.getByWorkspace(workspaceId).filter((i) => i.pinned);
  }
}

export const conversationRepo = new ConversationRepository();

export class ConversationService {
  /**
   * Posts a user message into the transaction stream
   */
  static postMessage(
    workspaceId: string,
    actorId: string,
    actorRole: ParticipantRole,
    content: string,
    attachments?: MessageAttachment[],
    replyToId?: string
  ): ConversationItem {
    const now = new Date().toISOString();
    const id = `citem_msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const item: ConversationItem = {
      id,
      workspaceId,
      itemType: "user_message",
      actorId,
      actorRole,
      content,
      attachments,
      replyToId,
      pinned: false,
      createdBy: actorId,
      createdAt: now,
      updatedAt: now,
      version: 1,
      status: "active",
    };

    conversationRepo.save(item);

    // 1. Index for Search
    workspaceSearchIndex.indexResource(
      workspaceId,
      "message",
      id,
      `Message from ${actorRole}`,
      content,
      ["message", actorRole],
      actorId
    );

    // 2. Publish Timeline Event & Emit Hooks
    const evt = dealRoomEvents.createEvent(
      workspaceId,
      actorId,
      actorRole,
      "message_sent",
      "New Message",
      content
    );
    void dealRoomEvents.publish(evt);
    void automationHooks.emit(evt);

    return item;
  }

  /**
   * Automatically generates a structured system event entry in the transaction stream
   */
  static appendSystemEvent(
    workspaceId: string,
    actorId: string,
    actorRole: ParticipantRole,
    title: string,
    description?: string,
    payload?: Record<string, unknown>
  ): ConversationItem {
    const now = new Date().toISOString();
    const id = `citem_sys_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const item: ConversationItem = {
      id,
      workspaceId,
      itemType: "system_event",
      actorId,
      actorRole,
      content: title,
      payload: { ...payload, description },
      pinned: false,
      createdBy: actorId,
      createdAt: now,
      updatedAt: now,
      version: 1,
      status: "active",
    };

    conversationRepo.save(item);
    return item;
  }

  /**
   * Embeds a structured transaction card (Offer, Inspection, Document, Call, Payment)
   */
  static embedCard<TPayload = Record<string, unknown>>(
    workspaceId: string,
    actorId: string,
    actorRole: ParticipantRole,
    itemType: ConversationItemType,
    title: string,
    payload: TPayload,
    pinned = false
  ): ConversationItem<TPayload> {
    const now = new Date().toISOString();
    const id = `citem_card_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const item: ConversationItem<TPayload> = {
      id,
      workspaceId,
      itemType,
      actorId,
      actorRole,
      content: title,
      payload,
      pinned,
      createdBy: actorId,
      createdAt: now,
      updatedAt: now,
      version: 1,
      status: "active",
    };

    conversationRepo.save(item as unknown as ConversationItem);

    // Audit Record
    auditLogService.log(
      workspaceId,
      "entity_created",
      actorId,
      actorRole,
      itemType,
      id,
      undefined,
      payload as Record<string, unknown>,
      `Embedded ${itemType} card`
    );

    return item;
  }

  /**
   * Pins or unpins a conversation item
   */
  static togglePin(itemId: string, actorId: string): ConversationItem | undefined {
    const item = conversationRepo.getById(itemId);
    if (!item) return undefined;

    item.pinned = !item.pinned;
    item.updatedBy = actorId;
    item.updatedAt = new Date().toISOString();
    item.version += 1;

    conversationRepo.save(item);
    return item;
  }
}
