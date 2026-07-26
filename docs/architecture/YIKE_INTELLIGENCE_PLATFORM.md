# Yike Intelligence Platform (YIP) — CORE Architecture

**Status:** CORE scaffold shipped — interfaces + registry + events + real Knowledge Layer. No ML/LLM/learning.
**Authority:** Founder-approved CORE implementation (2026-07-26)
**Code:** `src/lib/yip/`
**Related:** [METADATA_LISTING_ENGINE.md](./METADATA_LISTING_ENGINE.md) · [INTELLIGENT_MARKETPLACE.md](../product/INTELLIGENT_MARKETPLACE.md) · [FEATURE_FREEZE.md](../launch/FEATURE_FREEZE.md)

---

## What YIP is

YIP is Yike's marketplace-intelligence operating layer: one place applications ask "what does the platform already know, and what should it do with it?" instead of every route re-implementing lookups, price hints, trust checks, or recommendation logic.

**This sprint builds CORE only:** typed interfaces, a capability registry, an in-process event bus, and a real Knowledge Layer that wraps existing Yike data (vehicle makes/models, property categories, Nigeria locations). Every other module (pricing, trust, recommendation, media analysis, decision, workflow, rules, learning) ships as a documented **stub** — correct shape, honest "not available" behavior, zero fabricated intelligence.

## Why it's a separate package-shaped module

`src/lib/yip/` has **no** Next.js imports, no React, no `@/components` imports. It is designed to be extracted into its own npm package later and reused by other Stankings ecosystem products (BamSignal, BayRight) that need the same kind of marketplace intelligence scaffold but with different underlying data.

Yike-specific business logic (Nigerian vehicle makes, Nigerian states, Yike's property categories) lives in thin **adapter** files inside `knowledge/*` — the only files in YIP core allowed to import `@/lib/marketplace/*` or `@/constants/*`. Everything else in YIP is generic marketplace-intelligence code that would work for any classifieds/marketplace product.

---

## Principles

1. **Interfaces first.** Every capability is a TypeScript interface (`knowledge/types.ts`, `pricing/types.ts`, etc). Consumers depend on the interface, not the implementation.
2. **Registry, never direct provider imports.** Applications call `registry.get(CAPABILITIES.VEHICLE_KNOWLEDGE)`, never `import { DefaultVehicleKnowledge } from ".../vehicle"`. This is what makes providers swappable without call-site churn.
3. **Honesty over fabrication.** If CORE doesn't have real data (pricing comps, trust signals), the provider returns an explicit "not available" result — never a made-up number. This mirrors the Intelligent Marketplace OS "never invent metrics" rule.
4. **Strongly typed config, not DB JSON.** Capability descriptors, event shapes, and knowledge data are all plain TypeScript — compiler-checked, git-reviewable, IDE-autocompletable.
5. **Modular files, not a mega class.** Each concern (registry, events, knowledge, pricing, trust, …) is its own directory with `types.ts` + implementation files.
6. **No ML/LLM in this phase.** `learning/*` is a reserved interface whose methods throw `NotImplementedError`. `integration/*` only defines marker types for future external providers — nothing in YIP core calls out to OpenAI or any vendor.

---

## Module map

```
src/lib/yip/
  index.ts                 Public package surface (barrel export)
  bootstrap.ts              createYip() — wires registry + event bus + knowledge, registers defaults
  shared/                   Result, Confidence, CapabilityId/ProviderId brands, YipError hierarchy
  registry/                 CapabilityRegistry (register/get/tryGet/list/isEnabled/setEnabled) + typed capability ids
  plugins/                  YIP 2.0 plugin contract, PluginHost, dependency resolution, builtins/ (see YIP_PLUGIN_ARCHITECTURE.md)
  events/                   Discriminated YipEvent union + in-process EventBus (subscribe/publish/clear)
  knowledge/                Real data: vehicle/property/location knowledge + market/photo stubs + facade
  context/                  buildContext() — partial input → normalized YipContext
  decision/                 DecisionService interface + no-op default
  recommendation/           RecommendationEngine interface + empty-result stub
  validation/                ValidationService interface + passthrough (real validation still in listing-engine)
  pricing/                  PricingService / MarketAnalysis interface + "unavailable" stub
  trust/                    TrustService / TrustAssessment interface + neutral stub
  media/                    MediaIntelligenceService interface + count-only quality hints (no sharp, no vision model)
  workflow/                 WorkflowOrchestrator interface + empty-state stub
  rules/                    RulesEngine (named rule registry) — ships empty, no pre-registered rules
  integration/              ExternalProvider marker types ONLY — no real API calls
  analytics/                AnalyticsSink interface + no-op/console.debug default
  learning/                 LearningLayer interface — NOT IMPLEMENTED, throws on every call
  __tests__/                yip-core.test.ts (tsx --test)
```

Every directory follows the same shape: `types.ts` defines the interface(s) and value shapes; `index.ts` exports a default in-memory/stub implementation plus a `createX()` factory. Knowledge is the exception — it has one file per domain (`vehicle.ts`, `property.ts`, `location.ts`, `market.ts`, `photo.ts`) because those are real implementations, not stubs.

---

## Capability lifecycle

A capability is any unit of intelligence the registry can hand out.

```ts
type CapabilityDescriptor<T> = {
  id: CapabilityId;       // e.g. "vehicle.knowledge"
  version: string;        // bump when shape/behavior changes meaningfully
  enabled: boolean;       // registry.get() throws CapabilityDisabledError if false
  description: string;
  factory: () => T;       // called at most once per registry instance (memoized)
};
```

**Registered in CORE** (`registry/register-defaults.ts`):

| Capability id | Enabled | Backing |
|---|---|---|
| `vehicle.knowledge` | ✅ | Real — wraps `@/lib/marketplace/vehicle-makes` + `vehicle-specs` |
| `property.knowledge` | ✅ | Real — wraps `@/constants/listingTypes`, `propertyCategories`, `amenities` |
| `location.knowledge` | ✅ | Real — wraps `@/constants/nigeriaLocations` |
| `market.knowledge` | ✅ | Stub — always `{ available: false, reason: "insufficient_data" }` |
| `photo.knowledge` | ✅ | Static tips/min-max by domain/category |
| `recommendation.engine` | ❌ disabled | Stub — empty array |
| `pricing.engine` | ❌ disabled | Stub — unavailable |
| `trust.assessment` | ❌ disabled | Stub — neutral score, no signals |
| `media.analysis` | ❌ disabled | Stub — photo-count checks only |

Knowledge capabilities are enabled because they're real (wrapping existing constants, not learning anything). Everything past "knowledge" is registered so it's discoverable via `registry.list()`, but disabled — flipping `enabled: true` and swapping the `factory` is the whole upgrade path when real logic ships later.

**Adding a new capability:** define its interface in `<module>/types.ts`, ship a default implementation in `<module>/index.ts`, add a typed id to `registry/capabilities.ts`, register it in `register-defaults.ts`. No changes needed anywhere else.

---

## Provider lifecycle

A "provider" is the concrete implementation behind an interface (e.g. `DefaultVehicleKnowledge` behind `VehicleKnowledge`).

- Providers are constructed by the capability's `factory` and memoized by the registry — one instance per registry per process.
- Yike-specific providers (`knowledge/vehicle.ts`, `knowledge/property.ts`, `knowledge/location.ts`) are marked `// Yike adapter — extract behind provider interface for multi-product` and are the *only* files permitted to import `@/lib/marketplace/*` / `@/constants/*`.
- A different product (BamSignal, BayRight) extracting YIP would keep every interface and every non-knowledge module unchanged, and write its own `knowledge/*` adapter files against its own data source.

---

## Event lifecycle

`events/types.ts` defines a discriminated `YipEvent` union (`listing.created`, `listing.updated`, `listing.published`, `photo.uploaded`, `photo.removed`, `price.changed`, `category.selected`). `EventBus` is in-process pub/sub — no Redis, no queue, no persistence:

```ts
const unsubscribe = eventBus.subscribe("listing.created", (event) => { ... });
eventBus.publish({ type: "listing.created", occurredAt: new Date().toISOString(), payload: { ... } });
unsubscribe();
```

This is intentionally the simplest thing that works for request-scoped or single-process fan-out (e.g. publish `listing.created` → an analytics sink logs it in the same call). A durable/cross-process bus (Redis, queue) is a V2 concern if the product ever needs it — nothing here blocks that migration since consumers only depend on `subscribe`/`publish`.

---

## Extension guide

**Add a new knowledge domain** (e.g. `electronics.knowledge`):
1. Add the interface to `knowledge/types.ts`.
2. Add `knowledge/electronics.ts` with a `DefaultElectronicsKnowledge` wrapping whatever constants exist (or a new adapter if Yike doesn't have electronics data yet).
3. Add it to `KnowledgeFacade` in `knowledge/index.ts`.
4. Register a capability id + descriptor in `registry/capabilities.ts` + `register-defaults.ts`.

**Upgrade a stub to real logic** (e.g. `pricing.engine`): implement a new class satisfying `PricingService`, swap the `factory` in `register-defaults.ts`, flip `enabled: true`. No call sites change because they only ever asked the registry for `CAPABILITIES.PRICING_ENGINE`.

**Never** import a provider class directly from application code (`src/app/**`, `src/components/**`). Always go through `registry.get(...)` or the `KnowledgeFacade` returned by `createYip()`.

---

## Product naming

YIP is internal architecture. In consumer-facing UI, never use the word **"AI"**. Use:

- **Smart Assist** — general intelligent-suggestion surfaces
- **Listing Assistant** — anything that helps a seller fill out or improve a listing

This matches the Intelligent Marketplace OS doctrine: the platform "thinks first" quietly; it doesn't brand itself as an AI product.

---

## What is NOT built yet (by design)

| Area | Status |
|---|---|
| Real price comps / market analysis | Stub only — needs a sold/active-listing data pipeline (V2) |
| Trust scoring | Stub only — no verification signal aggregation yet |
| Recommendation ranking | Stub only — empty result, no similarity/collab-filter logic |
| Media/vision analysis (blur, duplicate/stolen detection) | Stub only — count checks only, no `sharp`/vision model calls from YIP |
| Workflow orchestration | Stub only — no persisted multi-step state |
| Rules engine | Ships empty — no pre-registered cross-cutting rules |
| External integrations (OpenAI, comps vendors, moderation APIs) | Marker types only — `integration/*` never calls out to a network in this sprint |
| **Learning layer** | **Not implemented.** Every method throws `NotImplementedError`. Reserved interface only — no ML, no feedback loops, no model training. Founder authority for this sprint explicitly excludes ML/LLM/learning algorithms. |

---

## Ecosystem extractability note (BamSignal / BayRight)

YIP core has zero framework or Yike-runtime coupling outside `knowledge/*` adapter files. To reuse YIP in another Stankings product:

1. Copy `src/lib/yip/` (minus the Yike-specific `knowledge/vehicle.ts` / `property.ts` / `location.ts` adapters).
2. Write new adapter files satisfying the same `VehicleKnowledge` / `PropertyKnowledge` / `LocationKnowledge` interfaces against that product's own data.
3. Everything else — registry, events, context builder, all the stub modules — works unmodified.

This is why the design goal insists on "no Next.js imports, no React, no `@/components`" inside `yip/*`: it's what makes step 3 true.

---

## YIP 2.0 — Plugins

**CORE stays exactly as documented above.** New intelligence is no longer wired into `register-defaults.ts` directly — it's added as a `YipPlugin` (typed TypeScript module, git-reviewed, no filesystem dynamic loading) installed through `PluginHost`. `createYip()` now installs `plugins/builtins/*` (the same nine capabilities this document describes) instead of calling `registerDefaults` directly; `registerDefaults` is kept as a deprecated thin wrapper for any external caller that still wants a plain-registry setup.

Applications are unaffected — `registry.get(...)` / `KnowledgeFacade` work exactly as before. See [YIP_PLUGIN_ARCHITECTURE.md](./YIP_PLUGIN_ARCHITECTURE.md) for the plugin contract, lifecycle, dependency/conflict resolution, and how to add a new plugin.

---

## Migration path: listing-engine catalogs → YIP knowledge

`src/lib/listing-engine/catalogs/registry.ts` (`CATALOG_REGISTRY`) is the **current, live** source of truth for listing-engine's dropdown options (`vehicle.makes`, `property.states`, etc). It is untouched by this sprint — all 28 `test:listing-engine` tests still pass unmodified.

In parallel, `src/lib/yip/knowledge/to-catalog-map.ts` builds a **structurally-compatible** map (`{ value, label }` options, `(values) => options[]` providers) from the same underlying data via `KnowledgeFacade`. `src/lib/listing-engine/catalogs/yip-bridge.ts` exposes this as `getListingCatalogsFromYip(): CatalogMap` — same shape as `CATALOG_REGISTRY`, resolved through YIP instead.

**Today:** `MetadataResolver` keeps using `CATALOG_REGISTRY` directly — no behavior change.

**Future migration (when ready):** swap the `catalogs` argument passed into `MetadataResolver.compute(...)` from `CATALOG_REGISTRY` to `getListingCatalogsFromYip()`. `to-catalog-map.ts` already covers every catalog id both registries share (`vehicle.types`, `vehicle.makes`, `vehicle.models_for_make`, spec catalogs, `property.*`). Because the shapes are identical, this is a call-site change only — no manifest or engine changes required. Do this only after confirming parity with a full `test:listing-engine` run against the YIP-backed map.
