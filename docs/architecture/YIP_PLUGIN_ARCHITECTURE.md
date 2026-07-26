# YIP 2.0 — Plugin Architecture

**Status:** Shipped — plugin contract, host, dependency resolution, builtin plugins. No ML/LLM.
**Authority:** Founder-approved CORE extension (2026-07-26) — see [FEATURE_FREEZE.md](../launch/FEATURE_FREEZE.md)
**Code:** `src/lib/yip/plugins/`
**Related:** [YIKE_INTELLIGENCE_PLATFORM.md](./YIKE_INTELLIGENCE_PLATFORM.md) · [YIP_RUNTIME.md](./YIP_RUNTIME.md) · [YIP_CORE_IMPLEMENTATION.md](../implementation/YIP_CORE_IMPLEMENTATION.md) · [YIP_2_PLUGIN_IMPLEMENTATION.md](../implementation/YIP_2_PLUGIN_IMPLEMENTATION.md)

> **Plugins are packages; the runtime is the OS.** This document is still the source of truth for the plugin *contract* and `PluginHost`'s lifecycle — nothing here changed when the runtime shipped. [YIP_RUNTIME.md](./YIP_RUNTIME.md) documents `CapabilityRuntime`, the OS façade that discovers, validates, and coordinates plugins through this exact same `PluginHost` (it does not re-implement anything below). Read this doc for "how does a plugin work"; read the runtime doc for "how does the platform start/stop/monitor/isolate a set of plugins."

---

## Why plugins

YIP CORE shipped a fixed set of capabilities wired directly in `registry/register-defaults.ts`. Every new piece of intelligence meant editing that file — fine for nine capabilities, not fine as the platform grows. YIP 2.0 keeps CORE (the registry, the event bus, the knowledge facade) completely stable and moves *capability registration* behind a plugin contract instead.

**Nothing about how applications consume intelligence changes.** `registry.get(CAPABILITIES.VEHICLE_KNOWLEDGE)` works exactly as before. Plugins are purely how a capability gets *installed* into the registry.

---

## OS / apps / drivers metaphor

Think of `CapabilityRegistry` + `EventBus` as the **kernel** — stable, generic, never changes per feature. A `YipPlugin` is a **driver**: it knows how to register one or more capabilities ("devices") and, optionally, react to platform events. Applications (`src/app/**`) are **apps** — they only ever talk to the kernel (`registry.get(...)`), never to a driver directly. `CapabilityRuntime` ([YIP_RUNTIME.md](./YIP_RUNTIME.md)) is the **operating system** around `PluginHost` — it decides *which drivers get loaded and in what order*, tracks permissions/providers/config/metrics, and exposes one diagnostics surface, but it still calls `PluginHost` for every actual lifecycle transition.

```
Applications (src/app/**, src/components/**)
        │  registry.get(CAPABILITIES.X) / knowledge.*
        ▼
CapabilityRegistry + EventBus   ← the kernel, unchanged by plugins
        ▲
        │  registerCapabilities(ctx) during initialize()
YipPlugin (driver/package)       ← vehicle-knowledge, pricing, trust, ...
        │
        ▼
PluginHost                       ← installs/enables/disables/health-checks drivers
        ▲
        │  installAll/enable/disable/reload/healthCheckAll (unchanged)
CapabilityRuntime                ← the OS façade — discovery, permissions,
                                    providers, config, metrics, soft sandbox,
                                    diagnostics (see YIP_RUNTIME.md)
```

---

## Plugin contract

A plugin is a plain, git-reviewed TypeScript object — no filesystem scanning, no dynamic `import()`, no DB-stored manifest. `src/lib/yip/plugins/types.ts` defines the shape; `definePlugin()` validates it at author time.

```ts
export type YipPlugin = {
  id: PluginId | string;
  name: string;
  version: string;
  description: string;
  capabilityType: string;          // "knowledge" | "recommendation" | "pricing" | "trust" | "media" | ...
  provides: string[];               // capability ids this plugin registers
  dependsOn?: string[];             // capability ids OR plugin ids that must be enabled first
  conflictsWith?: string[];         // plugin ids that cannot be enabled at the same time
  permissions?: PluginPermission[];
  supportedEvents?: string[];
  providers?: PluginProviderOption[];
  activeProviderId?: string;
  enabledByDefault?: boolean;       // false ⇒ installs initialized but disabled
  hooks: YipPluginHooks;
  registerCapabilities: (ctx: YipPluginContext) => void;
};
```

`registerCapabilities` is the only required behavior — it calls `ctx.registry.register(...)` with the same `CapabilityDescriptor` shape CORE always used. Everything else (hooks, deps, conflicts) is optional metadata the host uses to sequence installation safely.

---

## Lifecycle

```
registered → initialized → enabled ⇄ disabled → destroyed
                                    ↘ (remove: disable → onRemove → destroy)
```

| State | Reached by | Meaning |
|---|---|---|
| `registered` | `host.install(plugin)` | Contract validated, `onInstall` ran. Capabilities **not yet** registered. |
| `initialized` | `host.initialize(id)` | `registerCapabilities(ctx)` ran, `onInitialize` ran. Capability exists in the registry but may still be `enabled: false`. |
| `enabled` | `host.enable(id)` | Dependencies + conflicts checked, `onEnable` ran, every capability in `provides` flipped to `registry.setEnabled(id, true)`. |
| `disabled` | `host.disable(id)` | `onDisable` ran, capabilities flipped to `enabled: false` (and their memoized instance is dropped). |
| `destroyed` | `host.destroy(id)` / `host.remove(id)` | `onDestroy` ran, every `ctx.subscribe` handler this plugin registered is unsubscribed. |

`host.reload(id)` re-runs `onReload` and force-clears the memoized capability instance (disable→enable the underlying descriptor) without touching lifecycle state — use it after a config change that a provider needs to pick up. `host.upgrade(id, newPlugin)` swaps the plugin definition in place and calls the *new* plugin's `onUpgrade(ctx, fromVersion)`.

`host.installAll(plugins)` is the one call most code needs: it validates the dependency graph, topologically sorts it, then runs `install → initialize → enable` (skipping enable when `enabledByDefault === false`) for every plugin in order.

### Sync-fast-path

Every builtin hook is synchronous. `install`, `initialize`, `enable`, and `installAll` detect this and complete before returning — they only return a `Promise` when a hook genuinely returns one. This is what lets `createYip()` stay a plain synchronous function; callers don't need to `await` platform bootstrap just because the plugin contract *supports* async hooks.

---

## Registry + dependency resolution

`plugins/dependency.ts` resolves `dependsOn` entries against **either** a plugin id or a capability id any installed plugin `provides` — you can depend on `"vehicle.knowledge"` (a capability) or `"yip.vehicle-knowledge"` (the plugin id that provides it); both resolve to the same plugin.

- `validatePluginGraph(plugins)` — checks every `dependsOn` reference resolves to a known plugin, and detects dependency cycles. It does **not** reject conflicting plugins from being installed together — see below.
- `resolveInstallOrder(plugins)` — topological sort so dependencies always install/initialize/enable before their dependents.

### Conflicts are soft, dependencies are hard

- `dependsOn` is enforced at **enable time**: `host.enable(id)` throws `PluginDependencyError` if a referenced plugin/capability isn't enabled yet. It does *not* block co-installation — a plugin can sit `initialized` next to its not-yet-enabled dependency.
- `conflictsWith` is enforced at **enable time only**: two conflicting plugins may both be installed (and even both `initialized`), but `host.enable(id)` throws `PluginConflictError` if the conflicting plugin is currently `enabled`.

This mirrors real plugin systems (browser extensions, IDE plugins): declaring two incompatible drivers is fine, activating both at once isn't.

---

## Provider selection

A capability can have more than one candidate implementation (e.g. two pricing providers). `providers: PluginProviderOption[]` lists them; `activeProviderId` (or the option marked `default: true`) picks which one `registerCapabilities` should wire into the descriptor's `factory`. CORE ships no multi-provider plugin today — this is scaffolding for when a real pricing/trust provider needs an A/B or vendor-swap story, without another capability-id rename.

---

## Event subscriptions

Plugins never call `eventBus.subscribe` directly — they use `ctx.subscribe`, which is identical in signature but **tracked** by the host:

```ts
hooks: {
  onEnable: (ctx) => {
    ctx.subscribe("listing.created", (event) => { /* ... */ });
  },
},
```

Every subscription made through `ctx.subscribe` is unsubscribed automatically when the plugin is destroyed (`host.destroy(id)` / `host.remove(id)`) — a misbehaving or removed plugin can never leak a stale handler into the event bus.

---

## Observability

`PluginDiagnostics` (returned by `host.list()`) reports `state`, `errorCount`, `lastError`, `lastExecutionAt`, and the last known `health` for every installed plugin. `host.healthCheck(id)` / `host.healthCheckAll()` call the plugin's `hooks.healthCheck` if present; otherwise the host derives a default (`healthy` when `enabled`, `degraded` when `initialized`/`disabled`, `unhealthy` when `destroyed`). Any hook (lifecycle or health check) that throws increments `errorCount` and records `lastError` instead of crashing the host.

---

## Security / permissions

`permissions: PluginPermission[]` (`knowledge.read`, `events.subscribe`, `events.publish`, `analytics.track`, `registry.register`) is declarative metadata a plugin author states up front — reviewable in the same PR as the plugin's code. YIP 2.0 does not runtime-enforce these (there's no untrusted/dynamically-loaded code to sandbox — every plugin is a compiled TypeScript module reviewed like any other source file), but the field exists so:

1. A reviewer can see at a glance what a plugin claims to need.
2. A future admin surface (`/lex`) can render an honest capability list without inventing one.
3. If YIP is ever extended to load plugins from outside this repo, the enforcement point already has a place to attach to.

---

## Extension guide

**Add a new plugin** (e.g. a real pricing provider once V2 comps data exists):

```ts
// src/lib/yip/plugins/builtins/pricing-v2.ts  (or anywhere reviewed — builtins/ is just where CORE's ship)
import { definePlugin } from "../define-plugin";
import { CAPABILITIES } from "../../registry/capabilities";
import type { YipPlugin } from "../types";

export function createPricingV2Plugin(): YipPlugin {
  return definePlugin({
    id: "yip.pricing-v2",
    name: "Pricing Engine (comps-backed)",
    version: "1.0.0",
    description: "Real market price analysis backed by the comps data pipeline.",
    capabilityType: "pricing",
    provides: [CAPABILITIES.PRICING_ENGINE],
    conflictsWith: ["yip.pricing"],       // don't run both stub + real at once
    permissions: ["knowledge.read"],
    enabledByDefault: false,               // flip on once the data pipeline is live
    hooks: {
      healthCheck: () => ({ status: "healthy", checkedAt: new Date().toISOString() }),
    },
    registerCapabilities: (ctx) => {
      ctx.registry.register({
        id: CAPABILITIES.PRICING_ENGINE,
        version: "1.0.0",
        enabled: false,
        description: "Real market price analysis.",
        factory: () => createRealPricingService(),
      });
    },
  });
}
```

Then install it alongside (or instead of) the stub in whatever composes the platform for your app:

```ts
const plugins = new PluginHost({ registry, eventBus });
plugins.installAll([...createBuiltinPlugins(knowledge).filter((p) => p.id !== "yip.pricing"), createPricingV2Plugin()]);
```

No changes to `CapabilityRegistry`, `EventBus`, or any application call site — they still ask for `CAPABILITIES.PRICING_ENGINE` and get whichever provider is currently enabled behind it.

---

## Migration from `registerDefaults` → plugins

`registry/register-defaults.ts` still exists and still works — it's now `@deprecated` and unused by `createYip()`. The nine capabilities it used to register directly are now nine builtin plugins in `plugins/builtins/`, installed via `PluginHost.installAll()` from `bootstrap.ts`. Behavior is identical: knowledge capabilities enabled, intelligence stubs (`recommendation`, `pricing`, `trust`, `media.analysis`) registered but disabled.

External code that still imports `registerDefaults(registry, knowledge)` directly against its own `CapabilityRegistry` continues to work unmodified — it's a plain function, not removed.

---

## Success criteria

- CORE (`registry/`, `events/`, `knowledge/`) is unmodified in shape — the only addition is `CapabilityRegistry.setEnabled()`, needed so a plugin's enable/disable can flip descriptor state without the host reaching into registry internals.
- `createYip()` still returns synchronously and `registry.get(CAPABILITIES.VEHICLE_KNOWLEDGE)` still resolves Toyota models immediately after — no behavior change for existing callers.
- `getListingCatalogsFromYip()` and the 28 `test:listing-engine` tests are untouched.
- New capabilities are added by writing one plugin file + calling `installAll([...])` — no more editing a shared `register-defaults.ts` god-file.
- No ML/LLM anywhere — plugins are TypeScript modules with typed config, not model weights or prompts.
