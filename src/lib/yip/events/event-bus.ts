/**
 * Lightweight in-process pub/sub — no Redis, no queue. Good enough for
 * request-scoped or single-process fan-out (e.g. "listing created" triggers
 * a knowledge cache warm + analytics.track in the same process).
 */
import type { EventHandler, Unsubscribe, YipEvent, YipEventType } from "./types";

export class EventBus {
  private readonly handlers = new Map<YipEventType, Set<EventHandler>>();

  subscribe<T extends YipEventType>(type: T, handler: EventHandler<T>): Unsubscribe {
    const genericHandler = handler as unknown as EventHandler;
    const set = this.handlers.get(type) ?? new Set<EventHandler>();
    set.add(genericHandler);
    this.handlers.set(type, set);
    return () => {
      set.delete(genericHandler);
    };
  }

  publish(event: YipEvent): void {
    const eventWithTimestamp = { ...event, occurredAt: event.occurredAt ?? new Date().toISOString() };
    const set = this.handlers.get(event.type);
    if (!set || set.size === 0) return;
    for (const handler of Array.from(set)) {
      handler(eventWithTimestamp as never);
    }
  }

  /** Test/dev helper — removes every subscriber. */
  clear(): void {
    this.handlers.clear();
  }

  listenerCount(type: YipEventType): number {
    return this.handlers.get(type)?.size ?? 0;
  }
}
