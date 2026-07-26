/**
 * `createYip()` — the single entry point applications use to stand up the
 * platform: a capability registry (pre-populated with CORE defaults), an
 * event bus, and the knowledge facade for direct/typed access.
 */
import { EventBus } from "./events/event-bus";
import { createKnowledgeFacade, KnowledgeFacade } from "./knowledge";
import { CapabilityRegistry } from "./registry/capability-registry";
import { registerDefaults } from "./registry/register-defaults";

export type YipPlatform = {
  registry: CapabilityRegistry;
  eventBus: EventBus;
  knowledge: KnowledgeFacade;
};

export function createYip(): YipPlatform {
  const registry = new CapabilityRegistry();
  const eventBus = new EventBus();
  const knowledge = createKnowledgeFacade();

  registerDefaults(registry, knowledge);

  return { registry, eventBus, knowledge };
}
