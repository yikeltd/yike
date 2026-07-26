# YIP Runtime — Capability Runtime Architecture

**Status:** Shipped — the permanent platform foundation. No ML/LLM. **This is the last infrastructure layer.**
**Authority:** Founder-approved final CORE extension (2026-07-26) — see [FEATURE_FREEZE.md](../launch/FEATURE_FREEZE.md) · **[PLATFORM_CONSTITUTION.md](./PLATFORM_CONSTITUTION.md)** (architecture frozen)
**Code:** `src/lib/yip/runtime/`
**Related:** [PLATFORM_CONSTITUTION.md](./PLATFORM_CONSTITUTION.md) · [YIKE_INTELLIGENCE_PLATFORM.md](./YIKE_INTELLIGENCE_PLATFORM.md) · [YIP_PLUGIN_ARCHITECTURE.md](./YIP_PLUGIN_ARCHITECTURE.md) · [YIP_RUNTIME_IMPLEMENTATION.md](../implementation/YIP_RUNTIME_IMPLEMENTATION.md)

---

## STOP HERE — foundation complete

**YIP Runtime is the last platform layer.** CORE → plugins → runtime is the complete stack:

```
CapabilityRegistry + EventBus     (CORE — the kernel)
        ▲
PluginHost                        (drivers — install/enable/disable/health)
        ▲
CapabilityRuntime                 (the OS façade — discovery, permissions,
                                    providers, config, metrics, soft sandbox,
                                    diagnostics)
```

**Do not build another platform layer under this one.** No "meta-runtime", no "runtime orchestrator v2", no second dependency resolver, no second plugin contract. If a future need doesn't fit here, it's either:

1. A **capability** (a new `YipPlugin` — VIN decoding, flood-risk scoring, a real pricing engine, etc.) — write it as a plugin and register it. This is expected and is the *next* work.
2. A **runtime concern that already has a home** — permissions, providers, config, metrics, health, sandboxing all have an owner in `runtime/*` already; extend that file, don't create a parallel system.

Everything from here forward is **capabilities**, not **infrastructure**.

---

## What the runtime is

`CapabilityRuntime` is YIP's OS façade — the one object an application (or a future `/lex` diagnostics panel) talks to for platform-level concerns: *what capabilities exist, are they healthy, who's allowed to do what, which provider is active, and how do I start/stop the whole thing safely.*

It **does not duplicate** anything `PluginHost` already does. Every lifecycle transition (install → initialize → enable → disable → reload → upgrade → destroy) still happens exactly as documented in [YIP_PLUGIN_ARCHITECTURE.md](./YIP_PLUGIN_ARCHITECTURE.md) — the runtime only adds discovery, validation-before-install, and the operational concerns PluginHost was never meant to own (permissions, provider selection, config, metrics, soft isolation).

Think of it as: **plugins are packages, `PluginHost` is the package manager's install/enable engine, `CapabilityRuntime` is the operating system around that engine.**

---

## Module map

```
src/lib/yip/runtime/
  types.ts                  CapabilityManifest, RuntimeStatus, RuntimeDiagnostics, SoftSandboxPolicy, ...
  errors.ts                 InvalidManifestError, PermissionDeniedError, ProviderNotFoundError,
                             ConfigurationError, RuntimeStateError
  manifest.ts                toManifest(plugin) / assertValidManifest(manifest)
  permission-manager.ts      PermissionManager — grant/check/list per plugin × PluginPermission
  provider-resolver.ts       ProviderResolver — setActive/getActive/listProviders per capability
  configuration-manager.ts   ConfigurationManager — defaults + overrides + simple required-key validation
  logger.ts                  CapabilityLogger — scoped `[yip:runtime:<id>]` logging
  metrics.ts                 CapabilityMetrics — error counts, latency samples, snapshot()
  health-monitor.ts          CapabilityHealthMonitor — thin wrapper around PluginHost.healthCheckAll
  sandbox.ts                 SoftSandbox — try/catch + timeout + per-name circuit breaker
  discovery.ts               CapabilityDiscovery — in-memory registered-package list
  loader.ts                  CapabilityLoader — validates manifests + resolves install order
  lifecycle-manager.ts       LifecycleManager — start/stop/reloadCapability naming wrapper over PluginHost
  diagnostics.ts             buildRuntimeDiagnostics(...) — pure function assembling RuntimeDiagnostics
  capability-runtime.ts      CapabilityRuntime — the class applications use
  index.ts                   Public runtime surface (barrel export)
```

Every file is small and single-purpose, matching the rest of `yip/*` — no mega-class. `capability-runtime.ts` composes the others; it does not reimplement any of them.

---

## The manifest

A `CapabilityManifest` is the runtime's normalized, read-only view of a package. Every `YipPlugin` already carries everything a manifest needs — `toManifest()` derives one, so **plugin authors never write a second, parallel manifest file**.

```ts
type CapabilityManifest = {
  id: string;
  version: string;
  name: string;
  description: string;
  owner?: string;                     // informational — team/individual
  category: string;                   // from plugin.capabilityType
  provides: string[];                 // from plugin.provides
  dependsOn: string[];                // from plugin.dependsOn ?? []
  conflictsWith?: string[];
  eventsPublished: string[];          // reserved — no plugin declares this today
  eventsConsumed: string[];           // from plugin.supportedEvents ?? []
  permissions: PluginPermission[];    // from plugin.permissions ?? []
  featureFlags?: string[];
  configSchema?: CapabilityConfigSchema;
  compatibilityVersion?: string;
  supportedProviders?: PluginProviderOption[];  // from plugin.providers
  healthRequirements?: CapabilityHealthRequirements;
  enabledByDefault?: boolean;
};
```

`assertValidManifest()` checks the same non-negotiables `assertValidPlugin()` already checks (non-empty id/name/version/category, at least one `provides` entry), plus one manifest-only rule: any `configSchema.required` key must have a matching `configSchema.properties` entry, so "required" never references a key nobody described.

**Example — a future VIN Decoder plugin's manifest** (illustrative only; VIN decoding does not exist in CORE):

```ts
{
  id: "yip.vin-decoder",
  category: "vehicle-intelligence",
  provides: ["vehicle.vin-decode"],
  dependsOn: ["vehicle.knowledge"],
  permissions: ["knowledge.read", "events.publish"],
  configSchema: { required: ["providerApiKey"], properties: { providerApiKey: { type: "string" } } },
  enabledByDefault: false,
}
```

---

## Dependency resolution

The runtime does **not** ship a second dependency resolver. `CapabilityLoader.validateManifests()` and `.resolveOrder()` call straight into `plugins/dependency.ts`'s `validatePluginGraph()` / `resolveInstallOrder()` — the exact same graph rules documented in YIP_PLUGIN_ARCHITECTURE.md apply:

- `dependsOn` may reference a plugin id or a capability id another plugin `provides`.
- Missing dependencies and dependency cycles fail validation (`InvalidManifestError`, wrapping the same error text `validatePluginGraph` produces).
- `conflictsWith` is a **soft** constraint — checked only at `PluginHost.enable()` time, never at load/validate time.

`CapabilityLoader.validateManifests(plugins)` additionally runs `assertValidManifest()` over every derived manifest before touching the graph, so a malformed manifest fails with a manifest-shaped error instead of a confusing graph error.

---

## Lifecycle: startup

```ts
const runtime = new CapabilityRuntime({ registry, eventBus, plugins });
runtime.registerPackages(myPlugins);   // discovery — call before start()
runtime.start();                       // discover → validate → installAll → "running"
```

`start()`:

1. Reads every package `registerPackage()`/`registerPackages()` queued in `CapabilityDiscovery`.
2. Runs `CapabilityLoader.validateManifests(packages)` — throws `InvalidManifestError` on the first manifest or graph problem, setting `status = "failed"`.
3. For each valid manifest: grants its declared `permissions` via `PermissionManager.grant()`, and registers any `supportedProviders` with `ProviderResolver`.
4. Delegates to `PluginHost.installAll(packages)` — the exact same install → initialize → enable sequence documented in YIP_PLUGIN_ARCHITECTURE.md, run in dependency order.
5. Sets `status = "running"`.

**Sync fast-path preserved.** Every builtin plugin's hooks are synchronous, so `PluginHost.installAll()` completes before `start()` returns — no `await` needed, matching the sync-fast-path `PluginHost` already documents. `createYip()` stays a plain synchronous function. If a future plugin has a genuinely async hook, `installAll()` returns a `Promise`; `start()` still returns immediately (interface contract: `start(): void`) and flips `status` to `"running"`/`"failed"` once that promise settles.

`registerPackage()` throws `RuntimeStateError` if called after `start()` — every package must be known before the dependency graph is validated. This mirrors real OS package managers: you don't install a driver mid-boot.

---

## Lifecycle: shutdown

```ts
runtime.stop(); // disables every enabled plugin, status -> "stopped"
```

`PluginHost.disable()` is declared `async` — it is **always** asynchronous, even when every hook it calls is synchronous (an `await` inside an `async function` always yields at least one microtask, regardless of what's being awaited). Because `CapabilityRuntime.stop()`'s contract is synchronous (`stop(): void`), it **fires** `disable()` for every currently-enabled plugin without blocking on completion, then flips `status = "stopped"` immediately. A `.catch()` on each disable call logs failures and increments that plugin's error metric instead of producing an unhandled rejection.

If you need to *know* every capability finished disabling, call `runtime.diagnostics()` or `runtime.health()` after a short delay (or resolve the returned promises yourself with `LifecycleManager.stopCapability(id)` for single-plugin control) — `stop()` itself is fire-and-forget by design, matching its synchronous signature.

`reload(pluginId)` is the same pattern: fires `PluginHost.reload(pluginId)`, catches/logs failures, returns immediately.

---

## Permissions

`PermissionManager` is the runtime's enforcement point for `PluginPermission` (`knowledge.read`, `events.subscribe`, `events.publish`, `analytics.track`, `registry.register`). Default policy, matching what YIP_PLUGIN_ARCHITECTURE.md always intended for this field:

- Whatever a manifest's `permissions` array declares is granted automatically during `start()` — no separate approval step, since the declaration is already reviewed in the plugin's source PR.
- Anything **not** declared is denied by `check()`, even if the underlying plugin code never actually calls the corresponding capability. This makes `permissions.check(pluginId, "...")` usable as an honest capability audit, not just documentation.

```ts
runtime.permissions.check("yip.vehicle-knowledge", "knowledge.read"); // true — declared
runtime.permissions.check("yip.vehicle-knowledge", "registry.register"); // false — undeclared
```

---

## Providers

`ProviderResolver` backs `plugin.providers` / `plugin.activeProviderId` with a runtime-queryable API:

```ts
runtime.providers.listProviders("yip.pricing");      // PluginProviderOption[]
runtime.providers.getActive("yip.pricing");           // string | undefined
runtime.providers.setActive("yip.pricing", "vendor-b"); // throws ProviderNotFoundError if unknown
```

`registerProviders()` seeds the active provider from whichever option has `default: true`, matching the plugin contract's existing `PluginProviderOption.default` semantics. CORE ships no multi-provider capability today — this exists so the first real vendor-swap or A/B pricing/trust provider doesn't need a new runtime concept invented for it (see the extension guide below).

---

## Configuration

`ConfigurationManager` merges per-plugin defaults with runtime overrides and validates required keys against a simple `CapabilityConfigSchema` (`{ required?: string[]; properties?: {...} }` — intentionally not a JSON-schema engine):

```ts
runtime.config.setDefaults("yip.vin-decoder", { timeoutMs: 2000 });
runtime.config.setSchema("yip.vin-decoder", { required: ["providerApiKey"], properties: { providerApiKey: { type: "string" } } });
runtime.config.set("yip.vin-decoder", { providerApiKey: "..." }); // validates automatically; throws ConfigurationError if still missing
runtime.config.get("yip.vin-decoder"); // merged defaults + overrides
```

---

## Metrics

`CapabilityMetrics` tracks per-plugin error counts and latency samples in memory — no external metrics backend wired in. `snapshot(pluginId)` returns one plugin's counters; `snapshot()` (no argument) returns every plugin's. A future exporter (Prometheus, Datadog, whatever the ecosystem standardizes on) can poll `snapshot()` on an interval without this module changing.

---

## Health

`CapabilityHealthMonitor.runAll(host)` is a one-line wrapper around `PluginHost.healthCheckAll()` — the runtime does not re-implement health-check scheduling or aggregation logic; it only exists so `CapabilityRuntime.health()` has a stable, mockable seam. `CapabilityRuntime.health()` returns the same `PluginDiagnostics[]` shape `PluginHost` always returned (`state`, `health`, `errorCount`, `lastError`, `lastExecutionAt`).

`CapabilityHealthRequirements` on a manifest (`maxLatencyMs`, `minimumStatus`) is declarative metadata for a future readiness-gate/alerting consumer — the runtime does not currently enforce it (no capability ships one yet).

---

## Diagnostics

`runtime.diagnostics()` calls the pure function `buildRuntimeDiagnostics()`, assembling one `RuntimeDiagnostics` object:

```ts
type RuntimeDiagnostics = {
  status: RuntimeStatus;
  generatedAt: string;
  capabilities: CapabilityGraphNode[];        // pluginId, manifest, state, errorCount
  dependencies: DependencyEdge[];             // { from, to } — from every manifest's dependsOn
  health: Record<string, PluginHealth>;
  versions: Record<string, string>;
  permissions: Record<string, PluginPermission[]>;
  providers: Record<string, { active?: string; options: PluginProviderOption[] }>;
};
```

This is the single object a future `/lex` capability-runtime panel would render — every sub-graph (capabilities, dependencies, health, versions, permissions, providers) the task's design goals asked for, computed from `PluginHost.list()` plus the runtime's own bookkeeping. No separate persistence — it's a live snapshot, generated on demand.

---

## Failure recovery — soft sandbox

`SoftSandbox.run(name, fn, policy?)` wraps a capability invocation in:

1. **Timeout** — `Promise.race` against `policy.timeoutMs` (default `5000`ms).
2. **Circuit breaker** — after `policy.maxErrorsBeforeOpenCircuit` (default `5`) consecutive failures for that `name`, the circuit opens for `policy.circuitCooldownMs` (default `30000`ms); calls during that window fail fast with `circuit_open` instead of re-attempting a known-bad call.
3. **Swallowed failures by default** — `run()` returns `Promise<Result<T>>` and never rejects unless you pass `{ swallow: false }`. A failed/blocked call comes back as `{ ok: false, error: { code, message } }`, matching CORE's existing `Result<T, E>` convention (see `shared/types.ts`) so callers render an honest "unavailable" state instead of crashing.

This is explicitly **soft** isolation — a `try/catch` + timeout + circuit breaker in the same process, not a worker thread or VM sandbox. YIP plugins are reviewed TypeScript modules (no untrusted/dynamically-loaded code), so process-level isolation has never been the threat model here; the goal is fault containment (one misbehaving capability can't take down the request, or the process, that invoked it).

```ts
const result = await runtime.sandbox.run("vin-decode:external-api", () => decodeVin(vin));
if (!result.ok) {
  // render "VIN decode unavailable right now" — never fabricate a decoded result
}
```

---

## Extension guide

**Adding a new capability is still exactly what YIP_PLUGIN_ARCHITECTURE.md already documents** — write a `YipPlugin`, call `definePlugin()`, register it. The runtime changes nothing about that contract. What the runtime adds is *how you compose the platform*:

```ts
import { CapabilityRegistry, EventBus, PluginHost, CapabilityRuntime } from "@/lib/yip";
import { createBuiltinPlugins } from "@/lib/yip/plugins/builtins";
// import { createVinDecoderPlugin } from "./plugins/vin-decoder"; // hypothetical, not built

const registry = new CapabilityRegistry();
const eventBus = new EventBus();
const plugins = new PluginHost({ registry, eventBus });
const runtime = new CapabilityRuntime({ registry, eventBus, plugins });

runtime.registerPackages([
  ...createBuiltinPlugins(knowledge),
  // createVinDecoderPlugin(),
]);
runtime.start();

// Later, at request time:
runtime.permissions.check("yip.vin-decoder", "events.publish");
runtime.providers.getActive("yip.vin-decoder");
const result = await runtime.sandbox.run("vin-decode", () => registry.get(...).decode(vin));
```

**Never** build a second registry, a second plugin contract, or a second dependency resolver for a new capability's needs — extend the manifest (`configSchema`, `healthRequirements`, `supportedProviders`) instead. If a capability genuinely needs something the manifest doesn't express yet, extend `CapabilityManifest` in `runtime/types.ts` — that is still "capability infrastructure that already exists," not a new platform layer.

---

## What the runtime deliberately does not do

| Concern | Status |
|---|---|
| Filesystem/package-registry discovery | Not built — `CapabilityDiscovery` only holds statically registered TypeScript modules, same constraint as `plugins/*`. A future `discover()` implementation can scan an installed-packages manifest without `CapabilityRuntime` changing. |
| Hard process/VM isolation | Not built — `SoftSandbox` is try/catch + timeout + circuit breaker only. Plugins are reviewed source, not untrusted code. |
| Runtime permission *enforcement* at every call site | Declarative + queryable (`permissions.check(...)`), not automatically injected into every capability call — same posture YIP_PLUGIN_ARCHITECTURE.md already documented for `PluginPermission`. |
| Distributed/multi-process coordination | Not built — `EventBus` is still in-process pub/sub; the runtime coordinates one process's plugin set. |
| Any real capability (VIN decode, flood risk, real pricing/trust) | **Not built, and not in scope for this layer.** These are the next work, as plugins, on top of this runtime. |

---

## Non-negotiables verified

- `PluginHost` is unmodified — the runtime calls its existing public methods (`installAll`, `enable`, `disable`, `reload`, `list`, `healthCheckAll`) and adds no new methods to it.
- `plugins/dependency.ts` (`validatePluginGraph`, `resolveInstallOrder`) is unmodified and reused, not re-implemented.
- `CapabilityRegistry`'s public API is unchanged — the runtime only reads from it via the same `registry.get(...)` contract every other caller uses.
- No Next.js/React imports anywhere in `src/lib/yip/runtime/`.
- No filesystem dynamic loading, no DB-stored manifests — `CapabilityDiscovery` holds git-reviewed TypeScript modules only.
- No ML/LLM — `runtime/*` contains zero references to any named future capability (VIN Decoder, Flood Risk, OpenAI, or any vendor) outside of illustrative examples in documentation. Enforced by a grep-style test in `yip-runtime.test.ts`.
- `npm run test:yip`, `npm run test:listing-engine`, and `npx tsc --noEmit` all pass unmodified/green.
