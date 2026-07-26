# YIP 2.0 Plugin Architecture — Implementation Status

**Status:** Shipped — plugin contract, host, dependency resolution, 9 builtin plugins. No ML/LLM.
**Authority:** Founder-approved CORE extension (2026-07-26)
**Architecture:** [YIP_PLUGIN_ARCHITECTURE.md](../architecture/YIP_PLUGIN_ARCHITECTURE.md)
**Builds on:** [YIP_CORE_IMPLEMENTATION.md](./YIP_CORE_IMPLEMENTATION.md)

---

## What shipped

- `src/lib/yip/plugins/` — plugin contract (`types.ts`), error hierarchy (`errors.ts`), dependency graph resolution (`dependency.ts`), the plugin runtime (`host.ts`), the authoring helper (`define-plugin.ts`), and `builtins/` (9 thin plugins).
- `PluginHost` — `install`/`initialize`/`enable`/`disable`/`reload`/`upgrade`/`remove`/`destroy`/`installAll`/`list`/`get`/`healthCheck`/`healthCheckAll`. Tracks `ctx.subscribe` handlers per plugin and unsubscribes them on `destroy`.
- **Sync-fast-path:** `install`, `initialize`, `enable`, and `installAll` complete synchronously when a plugin's hooks are synchronous (true for every builtin) — `createYip()` remains a plain synchronous function. Any hook returning a real `Promise` still works; the call then returns a `Promise` instead of `void`.
- `validatePluginGraph` / `resolveInstallOrder` — `dependsOn` resolves against plugin ids **or** capability ids; missing deps and cycles fail validation. `conflictsWith` is a *soft* constraint enforced only at `enable()` time (co-installation is allowed).
- `CapabilityRegistry.setEnabled(id, enabled)` — new method; disabling drops the memoized instance so a later re-enable rebuilds it.
- 9 builtin plugins (`vehicle-knowledge`, `property-knowledge`, `location-knowledge`, `market-knowledge`, `photo-knowledge` enabled by default; `recommendation`, `pricing`, `trust`, `media-analysis` installed+initialized but disabled) — same descriptors previously in `register-defaults.ts`.
- `bootstrap.ts` — `createYip()` now builds a `PluginHost` and calls `installAll(createBuiltinPlugins(knowledge))` instead of `registerDefaults`. `YipPlatform` gained a `plugins: PluginHost` field.
- `registry/register-defaults.ts` — kept, marked `@deprecated`, unused by `createYip()` but still callable by any external code that registered against a bare `CapabilityRegistry` before plugins existed.

## Files

```
src/lib/yip/plugins/
  types.ts, errors.ts, dependency.ts, define-plugin.ts, host.ts, index.ts
  builtins/{vehicle-knowledge,property-knowledge,location-knowledge,market-knowledge,photo-knowledge,recommendation,pricing,trust,media-analysis,index}.ts

src/lib/yip/
  bootstrap.ts        (rewritten — PluginHost + createBuiltinPlugins)
  index.ts             (exports plugin types/PluginHost/definePlugin/BUILTIN_PLUGINS)
  registry/types.ts    (+ setEnabled on ICapabilityRegistry)
  registry/capability-registry.ts   (+ setEnabled implementation)
  registry/register-defaults.ts     (marked @deprecated, unchanged behavior)
  __tests__/yip-plugins.test.ts     (new — 32 assertions across dependency/host/bootstrap)
```

## API notes

- `YipPlatform.plugins: PluginHost` is new. `YipPlatform.registry`, `.eventBus`, `.knowledge` are unchanged.
- `registry.get(...)`, `.tryGet(...)`, `.list(...)`, `.isEnabled(...)`, `.has(...)` are byte-for-byte unchanged. `.setEnabled(id, enabled)` is additive.
- `dependsOn` references may be a plugin id (`"yip.vehicle-knowledge"`) or a capability id (`"vehicle.knowledge"`) — both resolve to the same plugin via `provides`.
- `enable()` auto-initializes a plugin still in `registered` state before enabling it — callers don't have to sequence `install → initialize → enable` by hand for the common case.
- `PluginHost.enable`/`installAll` return `void | Promise<void>` — safe to call without `await` when you know a plugin's hooks are synchronous (all builtins are); `await` the result when a plugin's hooks might be async.

## Tests

```bash
npm run test:yip             # 32 tests total — yip-core.test.ts (11) + yip-plugins.test.ts (21)
npm run test:listing-engine  # 28 tests — unchanged, still green
npx tsc --noEmit              # clean
```

`test:yip` now globs `src/lib/yip/__tests__/*.test.ts` so both files run under one script.

## Non-negotiables verified

- No Next.js / React imports anywhere in `src/lib/yip/plugins/`.
- Plugin config is plain TypeScript (`YipPlugin` object literals via `definePlugin`), not DB JSON — git-reviewed, compiler-checked.
- No filesystem dynamic loading — every builtin plugin is a statically imported module in `plugins/builtins/index.ts`.
- `CapabilityRegistry`'s public API (`get`/`tryGet`/`list`/`isEnabled`) is unchanged; only `setEnabled` was added.
- `listing-engine` (`CATALOG_REGISTRY`, `getListingCatalogsFromYip`) was not touched; its 28 tests pass unmodified.
- No mega-class: `host.ts` (lifecycle), `dependency.ts` (graph), `define-plugin.ts` (authoring), `builtins/*.ts` (one file per plugin) are all separate.

## Not built (intentionally)

Everything YIP CORE already deferred (real pricing comps, trust scoring, recommendation ranking, media/vision analysis, external integrations, the learning layer) is still deferred — plugins only changed *how* capabilities get installed, not *what* intelligence exists behind them.

## Next steps (not this sprint)

1. When a real pricing/trust/recommendation/media provider is founder-approved, ship it as a new plugin (see the extension guide in the architecture doc) rather than editing an existing builtin — use `conflictsWith` to retire the stub cleanly.
2. Consider a `/lex` diagnostics panel rendering `plugins.list()` / `plugins.healthCheckAll()` once there's more than the CORE stub set to monitor.
3. `providers`/`activeProviderId` scaffolding is unused today — first real multi-provider capability (e.g. two pricing vendors) is the first consumer.
