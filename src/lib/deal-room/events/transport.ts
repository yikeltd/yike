/**
 * Yike BTOS — Event Transport Abstraction Layer (Milestone 2 Refinement)
 * Decouples domain event publishing from underlying message brokers (Redis, Kafka, PubSub).
 */

import type { TimelineEvent } from "../types";
import { redisStreamAdapter, type EventStreamRecord } from "./redis-adapter";

export interface EventTransport {
  publish(event: TimelineEvent, correlationId?: string): Promise<EventStreamRecord>;
  subscribe(eventType: string, handler: (record: EventStreamRecord) => Promise<void>): void;
  replay(fromTimestamp?: string, workspaceId?: string): Promise<EventStreamRecord[]>;
  getDeadLetterQueue(): EventStreamRecord[];
}

export class RedisEventTransportAdapter implements EventTransport {
  public async publish(event: TimelineEvent, correlationId?: string): Promise<EventStreamRecord> {
    return redisStreamAdapter.publishToStream(event, correlationId, event.eventVersion);
  }

  public subscribe(eventType: string, handler: (record: EventStreamRecord) => Promise<void>): void {
    redisStreamAdapter.subscribeConsumer(eventType, handler);
  }

  public async replay(fromTimestamp?: string, workspaceId?: string): Promise<EventStreamRecord[]> {
    return redisStreamAdapter.replayStream(fromTimestamp, workspaceId);
  }

  public getDeadLetterQueue(): EventStreamRecord[] {
    return redisStreamAdapter.getDeadLetterQueue();
  }
}

export class KafkaEventTransportAdapter implements EventTransport {
  public async publish(event: TimelineEvent, correlationId?: string): Promise<EventStreamRecord> {
    // Adapter plug for Kafka / Google PubSub when scaling to multi-cluster message brokers
    return redisStreamAdapter.publishToStream(event, correlationId, event.eventVersion);
  }

  public subscribe(eventType: string, handler: (record: EventStreamRecord) => Promise<void>): void {
    redisStreamAdapter.subscribeConsumer(eventType, handler);
  }

  public async replay(fromTimestamp?: string, workspaceId?: string): Promise<EventStreamRecord[]> {
    return redisStreamAdapter.replayStream(fromTimestamp, workspaceId);
  }

  public getDeadLetterQueue(): EventStreamRecord[] {
    return redisStreamAdapter.getDeadLetterQueue();
  }
}

export const activeEventTransport: EventTransport = new RedisEventTransportAdapter();
