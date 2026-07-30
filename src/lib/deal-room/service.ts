/**
 * Yike Deal Room Platform — Core Service Layer
 * Enterprise transaction manager binding state transitions, access control, and event streams.
 */

import type { DealRoom, DealRoomStatus, ParticipantRole } from "./types";
import { validateTransition } from "./state-machine";
import { hasPermission, type DealAction } from "./permissions";
import { dealRoomEvents } from "./events";

export class DealRoomService {
  /**
   * Initializes a new transaction Deal Room
   */
  static createDealRoom(
    listingId: string,
    listingType: "vehicle" | "property" | "equipment" | "project",
    listingTitle: string,
    listingPrice: number,
    buyerId: string,
    sellerId: string
  ): DealRoom {
    const roomId = `deal_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const room: DealRoom = {
      id: roomId,
      listingId,
      listingType,
      listingTitle,
      listingPrice,
      currency: "NGN",
      status: "lead_created",
      buyerId,
      sellerId,
      participants: [
        {
          id: `part_b_${buyerId}`,
          dealRoomId: roomId,
          userId: buyerId,
          role: "buyer",
          status: "active",
          joinedAt: new Date().toISOString(),
        },
        {
          id: `part_s_${sellerId}`,
          dealRoomId: roomId,
          userId: sellerId,
          role: "seller",
          status: "active",
          joinedAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const event = dealRoomEvents.createEvent(
      roomId,
      buyerId,
      "buyer",
      "room_created",
      "Deal Room Created",
      `Deal Room initialized for ${listingTitle}`
    );
    void dealRoomEvents.publish(event);

    return room;
  }

  /**
   * Advances the Deal Room lifecycle state safely
   */
  static transitionState(
    room: DealRoom,
    actorId: string,
    actorRole: ParticipantRole,
    targetStatus: DealRoomStatus,
    reason?: string
  ): DealRoom {
    validateTransition(room.status, targetStatus);

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

    const updatedRoom: DealRoom = {
      ...room,
      status: targetStatus,
      updatedAt: new Date().toISOString(),
      closedAt: targetStatus === "completed" || targetStatus === "cancelled" ? new Date().toISOString() : room.closedAt,
    };

    const event = dealRoomEvents.createEvent(
      room.id,
      actorId,
      actorRole,
      targetStatus === "completed" ? "deal_completed" : targetStatus === "cancelled" ? "deal_cancelled" : "custom_event",
      `Status changed to ${targetStatus.replace("_", " ")}`,
      reason
    );
    void dealRoomEvents.publish(event);

    return updatedRoom;
  }
}
