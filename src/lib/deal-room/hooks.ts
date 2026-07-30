/**
 * Yike Transaction Workspace Engine — Automation Hooks Bus
 * Extensible event hook interface for background consumers (Notifications, AI, CRM, Webhooks).
 */

import type { TimelineEvent } from "./types";

export type AutomationHookHandler = (event: TimelineEvent) => void | Promise<void>;

class AutomationHookBus {
  private hooks: Map<string, Set<AutomationHookHandler>> = new Map();

  registerHook(eventType: string, handler: AutomationHookHandler): () => void {
    if (!this.hooks.has(eventType)) {
      this.hooks.set(eventType, new Set());
    }
    const handlers = this.hooks.get(eventType)!;
    handlers.add(handler);

    return () => {
      handlers.delete(handler);
    };
  }

  async emit(event: TimelineEvent): Promise<void> {
    const handlers = this.hooks.get(event.type);
    if (!handlers || handlers.size === 0) return;

    const promises = Array.from(handlers).map((h) =>
      Promise.resolve(h(event)).catch((err) => {
        console.error(`[AutomationHookBus] Hook execution failed for event ${event.type}:`, err);
      })
    );

    await Promise.all(promises);
  }
}

export const automationHooks = new AutomationHookBus();
