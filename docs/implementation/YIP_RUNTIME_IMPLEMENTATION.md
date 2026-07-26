# YIP Runtime — Implementation Status

**Status:** Shipped — capability runtime, manifests, permissions, providers, config, metrics, health, soft sandbox, diagnostics. No ML/LLM. **Foundation complete — last infrastructure layer.**
**Authority:** Founder-approved final CORE extension (2026-07-26)
**Architecture:** [YIP_RUNTIME.md](../architecture/YIP_RUNTIME.md)
**Builds on:** [YIP_CORE_IMPLEMENTATION.md](./YIP_CORE_IMPLEMENTATION.md) · [YIP_2_PLUGIN_IMPLEMENTATION.md](./YIP_2_PLUGIN_IMPLEMENTATION.md)

---

## What shipped

- `src/lib/yip/runtime/` — 14 files: `types.ts`, `errors.ts`, `manifest.ts`, `permission-manager.ts`, `provider-resolver.ts`, `configuration-manager.ts`, `logger.ts`, `metrics.ts`, `health-monitor.ts`, `sandbox.ts`, `discovery.ts`, `loader.ts`, `lifecycle-manager.ts`, `diagnostics.ts`, `capability-runtime.ts`, `index.ts`.
- `CapabilityRuntime` — the OS façade class: `registerPackage(s)`, `start()`, `stop()`, `reload(id)`, `getManifest(id)`, `listManifests()`, `diagnostics()`, `health()`, plus public `permissions` / `providers` / `config` / `metrics` / `sandbox` members.
- `toManifest(plugin)` derives a `CapabilityManifest` from an existing `YipPlugin` — no second manifest file for plugin authors to maintain. `assertValidManifest()` validates the derived (or hand-built) shape.
- `CapabilityLoader` reuses `validatePluginGraph`/`resolveInstallOrder` from `plugins/dependency.ts` — **no second dependency resolver was written**.
- `PermissionManager` — grants exactly what a manifest's `permissions` declares at `start()`/`registerPackage()`-time; denies everything undeclared.
- `ProviderResolver` — active-provider tracking per capability/plugin id, backed by `plugin.providers`/`activeProviderId`.
- `ConfigurationManager` — defaults + overrides merge, simple required-key validation against `CapabilityConfigSchema`.
- `CapabilityMetrics` — per-plugin error counts + latency samples, `snapshot()`.
- `CapabilityHealthMonitor` — one-line wrapper around `PluginHost.healthCheckAll()`; no health-check logic duplicated.
- `SoftSandbox` — try/catch + `Promise.race` timeout + per-name circuit breaker. Swallows failures into a `Result` by default (`{ swallow: false }` opts into throwing).
- `buildRuntimeDiagnostics()` — pure function assembling one `RuntimeDiagnostics` snapshot (capabilities/dependencies/health/versions/permissions/providers) from `PluginHost.list()` + the runtime's own state.
- `bootstrap.ts` rewritten: `createYip()` now builds a `CapabilityRuntime`, calls `runtime.registerPackages(createBuiltinPlugins(knowledge))`, then `runtime.start()` — which performs discovery → manifest validation → `plugins.installAll(...)` internally. `YipPlatform` gained `runtime: CapabilityRuntime`.
- `src/lib/yip/index.ts` — exports the full runtime public surface.

## Files

```
src/lib/yip/runtime/
  types.ts, errors.ts, manifest.ts, permission-manager.ts, provider-resolver.ts,
  configuration-manager.ts, logger.ts, metrics.ts, health-monitor.ts, sandbox.ts,
  discovery.ts, loader.ts, lifecycle-manager.ts, diagnostics.ts,
  capability-runtime.ts, index.ts

src/lib/yip/
  bootstrap.ts        (rewritten — builds CapabilityRuntime, calls registerPackages + start())
  index.ts             (exports runtime types/classes)
  __tests__/yip-runtime.test.ts   (new — 17 tests across start/diagnostics/permissions/sandbox/stop/reload/manifest)
```

## API notes

- `YipPlatform.runtime: CapabilityRuntime` is new. `.registry`, `.eventBus`, `.knowledge`, `.plugins` are unchanged.
- `createYip()` is still a plain synchronous function — `runtime.start()` completes before `createYip()` returns because every builtin plugin's hooks are synchronous (same sync-fast-path guarantee `PluginHost` already provided).
- `CapabilityRuntime.stop()` / `.reload(id)` are synchronous-returning (`void`) but fire the underlying `PluginHost.disable`/`.reload` calls without blocking — those host methods are declared `async` (always yield at least one microtask), so a caller that needs to confirm completion should check `diagnostics()`/`health()` afterward, or call `LifecycleManager.stopCapability(id)` directly for a promise it can await.
- `registerPackage()`/`registerPackages()` must be called **before** `start()` — calling either after `start()` throws `RuntimeStateError`. This matches "every driver known before boot."
- `PermissionManager`, `ProviderResolver`, `ConfigurationManager`, `CapabilityMetrics`, and `SoftSandbox` are all usable standalone (constructed directly) for unit tests or a bare `PluginHost` setup that doesn't want the full `CapabilityRuntime` — none of them depend on `CapabilityRuntime` itself.

## Tests

```bash
npm run test:yip             # 49 tests total — yip-core (11) + yip-plugins (21) + yip-runtime (17)
npm run test:listing-engine  # 28 tests — unchanged, still green
npx tsc --noEmit              # clean
npm run build                 # clean production build
```

`yip-runtime.test.ts` covers:

- `createYip().runtime.status === "running"` after bootstrap.
- `diagnostics()` includes builtin knowledge plugin manifests with health + version graphs.
- `health()` delegates to `PluginHost.healthCheckAll()`.
- Permission grant/check works standalone and via `createYip()`'s automatic grant-at-start.
- `SoftSandbox` swallows thrown errors into a `Result` by default, opens its circuit after `maxErrorsBeforeOpenCircuit` consecutive failures, blocks further calls with `circuit_open` while the circuit is open, resets its error count on a subsequent success, and re-throws when `swallow: false` is passed.
- `stop()` flips `status` to `"stopped"` and is idempotent.
- `reload()` does not throw for a currently-installed plugin.
- The registry still resolves Toyota models through `CAPABILITIES.VEHICLE_KNOWLEDGE` after `runtime.start()` — capability contract unchanged end-to-end.
- `toManifest()` correctly derives id/provides/dependsOn/permissions from a `YipPlugin`.
- A grep-style test asserts no file under `src/lib/yip/runtime/` mentions `VIN Decoder`, `Flood Risk`, or `OpenAI` — the runtime stays capability-agnostic; those only ever appear as illustrative examples in documentation.

## Non-negotiables verified

- `PluginHost` (`plugins/host.ts`) is **byte-for-byte unmodified** — the runtime only calls its existing public methods.
- `plugins/dependency.ts` (`validatePluginGraph`, `resolveInstallOrder`) is **unmodified and reused**, not re-implemented — `CapabilityLoader` is a thin wrapper.
- `CapabilityRegistry`'s public API is unchanged.
- No Next.js / React imports anywhere in `src/lib/yip/runtime/`.
- No filesystem dynamic loading, no DB-stored manifests — `CapabilityDiscovery` only ever holds statically registered, git-reviewed `YipPlugin` modules.
- No ML/LLM anywhere in `runtime/*`.
- No mega-class — 14 single-purpose files compose into `CapabilityRuntime`, none of them duplicate another's job.
- `listing-engine` (`CATALOG_REGISTRY`, `getListingCatalogsFromYip`) untouched; its 28 tests pass unmodified.

## Foundation complete — what's next is capabilities, not infrastructure

**This is the last platform/infrastructure layer YIP will get.** CORE (registry + events + knowledge) → plugins (contract + host) → runtime (discovery + permissions + providers + config + metrics + health + soft sandbox + diagnostics) is the complete operating stack.

The next YIP work — whenever founder-approved — is **capabilities**: real VIN decoding, flood-risk scoring, comps-backed pricing, trust-signal aggregation, media/vision analysis, etc. Each of those ships as a `YipPlugin` (see [YIP_PLUGIN_ARCHITECTURE.md](../architecture/YIP_PLUGIN_ARCHITECTURE.md)'s extension guide) registered with `runtime.registerPackage(...)`. None of them require a new platform layer, a new dependency resolver, a new plugin contract, or a new registry — every hook they need (permissions, providers, config, health, soft isolation, diagnostics) already exists in `runtime/*`.

## Not built (intentionally)

Everything YIP CORE and YIP 2.0 already deferred (real pricing comps, trust scoring, recommendation ranking, media/vision analysis, external integrations, the learning layer) is still deferred — the runtime only changed *how the platform boots, monitors, and coordinates* installed capabilities, not *what intelligence exists behind them*. Filesystem/registry-based plugin discovery, hard process/VM sandboxing, and distributed/multi-process event coordination are also explicitly out of scope — see YIP_RUNTIME.md's "What the runtime deliberately does not do" table.
