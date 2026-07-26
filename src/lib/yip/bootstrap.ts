/**
 * `createYip()` — the single entry point applications use to stand up the
 * platform: a capability registry, an in-process event bus, the knowledge
 * facade for direct/typed access, and the plugin host that installed CORE's
 * builtin plugins (knowledge providers enabled, intelligence stubs
 * registered-but-disabled).
 */
import { EventBus } from "./events/event-bus";
import { createKnowledgeFacade, KnowledgeFacade } from "./knowledge";
import { createBuiltinPlugins } from "./plugins/builtins";
import { PluginHost } from "./plugins/host";
import { CapabilityRegistry } from "./registry/capability-registry";

export type YipPlatform = {
  registry: CapabilityRegistry;
  eventBus: EventBus;
  knowledge: KnowledgeFacade;
  plugins: PluginHost;
};

export function createYip(): YipPlatform {
  const registry = new CapabilityRegistry();
  const eventBus = new EventBus();
  const knowledge = createKnowledgeFacade();
  const plugins = new PluginHost({ registry, eventBus });

  // Every builtin plugin's hooks are synchronous, so `installAll` completes
  // before this line returns — no `await` needed for `createYip()` to stay
  // a plain synchronous function that callers can use immediately.
  plugins.installAll(createBuiltinPlugins(knowledge));

  return { registry, eventBus, knowledge, plugins };
}
