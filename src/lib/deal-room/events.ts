/**
 * Yike Deal Room Platform — Pluggable Timeline & Event Bus Engine
 */

import type { TimelineEvent, TimelineEventType, ParticipantRole } from "./types";

export type EventSubscriber = (event: TimelineEvent) => void | Promise<void>;

class DealRoomEventBus {
  private subscribers: Map<string, Set<EventSubscriber>> = new Map();

  subscribe(dealRoomId: string, callback: EventSubscriber): () => void {
    if (!this.subscribers.has(dealRoomId)) {
      this.subscribers.set(dealRoomId, new Set());
    }
    const roomSubs = this.subscribers.get(dealRoomId)!;
    roomSubs.add(callback);

    return () => {
      roomSubs.delete(callback);
      if (roomSubs.size === 0) {
        this.subscribers.delete(dealRoomId);
      }
    };
  }

  async publish(event: TimelineEvent): Promise<void> {
    const roomSubs = this.subscribers.get(event.dealRoomId);
    if (!roomSubs || roomSubs.size === 0) return;

    const promises = Array.from(roomSubs).map((sub) =>
      Promise.resolve(sub(event)).catch((err) => {
        console.error(`[DealRoomEventBus] Error in subscriber for event ${event.id}:`, err);
      })
    );

    await Promise.all(promises);
  }

  createEvent(
    dealRoomId: string,
    actorId: string,
    actorRole: ParticipantRole,
    type: TimelineEventType,
    title: string,
    description?: string,
    payload?: Record<string, unknown>,
    correlationId?: string
  ): TimelineEvent {
    const now = new Date().toISOString();
    return {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      dealRoomId,
      actorId,
      actorRole,
      type,
      title,
      description,
      payload,
      eventVersion: 1,
      schemaVersion: 1,
      source: "yike_deal_room_engine",
      correlationId: correlationId || `corr_${dealRoomId}`,
      createdBy: actorId,
      createdAt: now,
      updatedAt: now,
      version: 1,
      status: "active",
    };
  }
}

export const dealRoomEvents = new DealRoomEventBus();
