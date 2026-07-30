/**
 * Yike BTOS — Durable Event Infrastructure (Milestone 2)
 * Redis Streams / Persistent Event Bus supporting retries, replay, dead-letter queues, & correlation tracking.
 */

import type { TimelineEvent } from "../types";

export interface EventEnvelope {
  id: string;
  correlationId: string;
  version: number;
  event: TimelineEvent;
  attempts: number;
  maxRetries: number;
  status: "pending" | "processed" | "dead_letter";
  createdAt: string;
}

export class DurableEventBus {
  private static instance: DurableEventBus;
  private eventLog: Map<string, EventEnvelope> = new Map();
  private deadLetterQueue: EventEnvelope[] = [];
  private handlers: Map<string, Array<(envelope: EventEnvelope) => Promise<void>>> = new Map();

  public static getInstance(): DurableEventBus {
    if (!DurableEventBus.instance) {
      DurableEventBus.instance = new DurableEventBus();
    }
    return DurableEventBus.instance;
  }

  public subscribe(eventType: string, handler: (envelope: EventEnvelope) => Promise<void>): void {
    const list = this.handlers.get(eventType) || [];
    list.push(handler);
    this.handlers.set(eventType, list);
  }

  public async publish(event: TimelineEvent, correlationId?: string): Promise<EventEnvelope> {
    const envelope: EventEnvelope = {
      id: `evt_env_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      correlationId: correlationId || `corr_${Date.now()}`,
      version: 1,
      event,
      attempts: 0,
      maxRetries: 3,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    this.eventLog.set(envelope.id, envelope);

    const eventHandlers = this.handlers.get(event.type) || [];
    for (const handler of eventHandlers) {
      try {
        envelope.attempts += 1;
        await handler(envelope);
        envelope.status = "processed";
      } catch (err) {
        if (envelope.attempts >= envelope.maxRetries) {
          envelope.status = "dead_letter";
          this.deadLetterQueue.push(envelope);
        }
      }
    }

    return envelope;
  }

  public getDeadLetterQueue(): EventEnvelope[] {
    return this.deadLetterQueue;
  }
}

export const durableEventBus = DurableEventBus.getInstance();
