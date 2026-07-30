/**
 * Yike Transaction Workspace Engine — Core Service Layer (Hardened)
 * Binds state transitions, access control, audit logging, and automation hooks.
 */

import type { TransactionWorkspace, DealRoomStatus, ParticipantRole } from "./types";
import { validateTransition } from "./state-machine";
import { hasPermission, type DealAction } from "./permissions";
import { dealRoomEvents } from "./events";
import { auditLogService } from "./audit";
import { automationHooks } from "./hooks";

export class DealRoomService {
  /**
   * Initializes a new Transaction Workspace (Deal Room)
   */
  static createDealRoom(
    listingId: string,
    listingType: "vehicle" | "property" | "equipment" | "project",
    listingTitle: string,
    listingPrice: number,
    buyerId: string,
    sellerId: string
  ): TransactionWorkspace {
    const roomId = `workspace_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    const room: TransactionWorkspace = {
      id: roomId,
      listingId,
      listingType,
      listingTitle,
      listingPrice,
      currency: "NGN",
      workspaceStatus: "lead_created",
      buyerId,
      sellerId,
      createdBy: buyerId,
      createdAt: now,
      updatedAt: now,
      version: 1,
      status: "active",
      participants: [
        {
          id: `part_b_${buyerId}`,
          dealRoomId: roomId,
          userId: buyerId,
          role: "buyer",
          participantStatus: "active",
          joinedAt: now,
          createdBy: buyerId,
          createdAt: now,
          updatedAt: now,
          version: 1,
          status: "active",
        },
        {
          id: `part_s_${sellerId}`,
          dealRoomId: roomId,
          userId: sellerId,
          role: "seller",
          participantStatus: "active",
          joinedAt: now,
          createdBy: sellerId,
          createdAt: now,
          updatedAt: now,
          version: 1,
          status: "active",
        },
      ],
    };

    // 1. Create Timeline Event
    const event = dealRoomEvents.createEvent(
      roomId,
      buyerId,
      "buyer",
      "room_created",
      "Workspace Created",
      `Transaction Workspace initialized for ${listingTitle}`
    );
    void dealRoomEvents.publish(event);

    // 2. Log Legal Audit Record
    auditLogService.log(
      roomId,
      "entity_created",
      buyerId,
      "buyer",
      "TransactionWorkspace",
      roomId,
      undefined,
      { status: "lead_created" },
      "Workspace initialization"
    );

    // 3. Emit Automation Hook
    void automationHooks.emit(event);

    return room;
  }

  /**
   * Advances the Transaction Workspace lifecycle state safely
   */
  static transitionState(
    room: TransactionWorkspace,
    actorId: string,
    actorRole: ParticipantRole,
    targetStatus: DealRoomStatus,
    reason?: string
  ): TransactionWorkspace {
    validateTransition(room.workspaceStatus, targetStatus);

    const actionMap: Partial<Record<DealRoomStatus, DealAction>> = {
      negotiation: "send_message",
      inspection_requested: "request_inspection",
      offer_sent: "make_offer",
      offer_accepted: "accept_offer",
      completed: "complete_deal",
      cancelled: "cancel_deal",
    };

    const requiredAction = actionMap[targetStatus];
    if (requiredAction && !hasPermission(actorRole, requiredAction)) {
      throw new Error(`Role '${actorRole}' is not authorized to perform '${requiredAction}'.`);
    }

    const now = new Date().toISOString();
    const updatedRoom: TransactionWorkspace = {
      ...room,
      workspaceStatus: targetStatus,
      updatedBy: actorId,
      updatedAt: now,
      version: room.version + 1,
      closedAt: targetStatus === "completed" || targetStatus === "cancelled" ? now : room.closedAt,
    };

    // 1. Publish Timeline Event
    const event = dealRoomEvents.createEvent(
      room.id,
      actorId,
      actorRole,
      targetStatus === "completed" ? "deal_completed" : targetStatus === "cancelled" ? "deal_cancelled" : "custom_event",
      `Status changed to ${targetStatus.replace("_", " ")}`,
      reason
    );
    void dealRoomEvents.publish(event);

    // 2. Log Legal Audit Record
    auditLogService.log(
      room.id,
      "state_transitioned",
      actorId,
      actorRole,
      "TransactionWorkspace",
      room.id,
      { status: room.workspaceStatus },
      { status: targetStatus },
      reason
    );

    // 3. Emit Automation Hook
    void automationHooks.emit(event);

    return updatedRoom;
  }

  /**
   * Performs audit-safe soft deletion
   */
  static softDeleteWorkspace(room: TransactionWorkspace, actorId: string, reason?: string): TransactionWorkspace {
    const now = new Date().toISOString();
    const updatedRoom: TransactionWorkspace = {
      ...room,
      status: "deleted",
      deletedBy: actorId,
      deletedAt: now,
      updatedAt: now,
      version: room.version + 1,
    };

    auditLogService.log(
      room.id,
      "entity_soft_deleted",
      actorId,
      "administrator",
      "TransactionWorkspace",
      room.id,
      { status: room.status },
      { status: "deleted" },
      reason
    );

    return updatedRoom;
  }
}
