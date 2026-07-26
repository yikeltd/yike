/**
 * `createYip()` — the single entry point applications use to stand up the
 * platform: a capability registry, an in-process event bus, the knowledge
 * facade for direct/typed access, the plugin host, and the `CapabilityRuntime`
 * (the OS façade — see docs/architecture/YIP_RUNTIME.md) that discovers,
 * validates, and installs CORE's builtin plugins through that host.
 */
import { EventBus } from "./events/event-bus";
import { createKnowledgeFacade, KnowledgeFacade } from "./knowledge";
import { createBuiltinPlugins } from "./plugins/builtins";
import { PluginHost } from "./plugins/host";
import { CapabilityRegistry } from "./registry/capability-registry";
import { CapabilityRuntime } from "./runtime/capability-runtime";

export type YipPlatform = {
  registry: CapabilityRegistry;
  eventBus: EventBus;
  knowledge: KnowledgeFacade;
  plugins: PluginHost;
  runtime: CapabilityRuntime;
};

export function createYip(): YipPlatform {
  const registry = new CapabilityRegistry();
  const eventBus = new EventBus();
  const knowledge = createKnowledgeFacade();
  const plugins = new PluginHost({ registry, eventBus });
  const runtime = new CapabilityRuntime({ registry, eventBus, plugins });

  // Every builtin plugin's hooks are synchronous, so `runtime.start()` (which
  // delegates to `plugins.installAll`) completes before this line returns —
  // no `await` needed for `createYip()` to stay a plain synchronous function
  // that callers can use immediately.
  runtime.registerPackages(createBuiltinPlugins(knowledge));
  runtime.start();

  return { registry, eventBus, knowledge, plugins, runtime };
}
