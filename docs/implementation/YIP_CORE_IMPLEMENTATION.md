# YIP CORE — Implementation Status

**Status:** Shipped — interfaces + registry + events + real Knowledge Layer. No ML/LLM/learning.
**Authority:** Founder-approved CORE implementation (2026-07-26)
**Architecture:** [YIKE_INTELLIGENCE_PLATFORM.md](../architecture/YIKE_INTELLIGENCE_PLATFORM.md)
**Superseded bootstrap wiring:** `createYip()` now installs capabilities through the plugin host, not `registerDefaults` directly — see [YIP_2_PLUGIN_IMPLEMENTATION.md](./YIP_2_PLUGIN_IMPLEMENTATION.md) · [YIP_PLUGIN_ARCHITECTURE.md](../architecture/YIP_PLUGIN_ARCHITECTURE.md). Everything below (registry API, knowledge layer, event bus) is unchanged.

---

## What shipped

- `src/lib/yip/` — 16 modules, each with `types.ts` + implementation, zero Next.js/React imports.
- `CapabilityRegistry` — register/get/tryGet/list/isEnabled, memoized factories.
- `EventBus` — in-process subscribe/publish/clear over a discriminated `YipEvent` union.
- **Real Knowledge Layer**: `VehicleKnowledge`, `PropertyKnowledge`, `LocationKnowledge` wrap existing `@/lib/marketplace/*` and `@/constants/*` data (no new data, no duplication).
- **Honest stubs** for everything past knowledge: `market.knowledge`, `pricing.engine`, `trust.assessment`, `recommendation.engine`, `media.analysis`, `decision`, `workflow`, `rules`, `validation` (passthrough), `analytics` (no-op).
- `learning/*` — reserved interface, every method throws `NotImplementedError`. Documented as not implemented.
- `integration/*` — external provider **marker types only**; no network calls anywhere in `yip/*`.
- `bootstrap.ts` — `createYip()` wires registry + event bus + knowledge facade and calls `registerDefaults()`.
- Listing-engine bridge — `getListingCatalogsFromYip()`; **ListingEngine UI now resolves catalogs via YIP Knowledge** (tests still use `CATALOG_REGISTRY` directly).

## Files

```
src/lib/yip/
  index.ts, bootstrap.ts
  shared/{types,errors}.ts
  registry/{types,capability-registry,capabilities,register-defaults}.ts
  events/{types,event-bus}.ts
  knowledge/{types,vehicle,property,location,market,photo,index,to-catalog-map}.ts
  context/{types,build-context}.ts
  decision/{types,index}.ts
  recommendation/{types,index}.ts
  validation/{types,index}.ts
  pricing/{types,index}.ts
  trust/{types,index}.ts
  media/{types,index}.ts
  workflow/{types,index}.ts
  rules/{types,index}.ts
  integration/{types,index}.ts
  analytics/{types,index}.ts
  learning/{types,index}.ts
  __tests__/yip-core.test.ts

src/lib/listing-engine/catalogs/yip-bridge.ts   (new — additive)
src/lib/listing-engine/index.ts                  (added getListingCatalogsFromYip export)
```

## Tests

```bash
npm run test:yip             # 32 tests total — this file's 11 (registry, event bus, bootstrap defaults, vehicle/market knowledge, context, learning stub) + yip-plugins.test.ts's 21
npm run test:listing-engine  # 28 tests — unchanged, still green
npx tsc --noEmit              # clean
```

## Non-negotiables verified

- No Next.js / React imports anywhere in `src/lib/yip/`.
- `@/lib/marketplace/*` and `@/constants/*` imports exist **only** in `knowledge/vehicle.ts`, `knowledge/property.ts`, `knowledge/location.ts` — each marked `// Yike adapter — extract behind provider interface for multi-product`.
- Capability config is plain TypeScript (`CapabilityDescriptor` objects), not DB JSON.
- Applications are expected to consume capabilities via `registry.get(...)` / `KnowledgeFacade` — no direct provider imports outside `yip/*`.
- `listing-engine` was not deleted or behaviorally changed; its 28 tests pass unmodified.

## Not built (intentionally)

See "What is NOT built yet" in the architecture doc — pricing comps, trust scoring, recommendation ranking, media/vision analysis, workflow persistence, rules pre-registration, external integrations, and the learning layer are all out of scope for CORE.

## Next steps (not this sprint)

1. ~~Wire `getListingCatalogsFromYip()` into ListingEngine~~ — done (create/edit UI).
2. Decide which stub (pricing, trust, recommendation, media) gets real logic first — each is an isolated swap behind its existing interface.
3. If/when a learning phase is founder-approved, implement `LearningLayer` against the same interface — no call-site changes needed since nothing depends on it yet.
4. Optional: deprecate duplicate catalog providers in `listing-engine/catalogs/{vehicle,property}.ts` once YIP is the sole runtime source.
