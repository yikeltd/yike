# Yike Platform Constitution

**Status:** ACTIVE — architecture frozen  
**Declared:** 2026-07-26  
**Authority:** Founder

> Congratulations. You have stopped building an application. You're now building a platform.  
> **No more infrastructure layers.**

This document is the constitution every engineer and agent follows. Product may evolve for years. The platform core must not.

---

## Platform complete

The intelligence stack is finished:

```
CapabilityRegistry + EventBus     CORE — kernel
        ▲
PluginHost                        drivers — install / enable / disable / health
        ▲
CapabilityRuntime                 OS façade — discovery, permissions, providers,
                                  config, metrics, soft sandbox, diagnostics
```

Code: `src/lib/yip/` · Listing engine: `src/lib/listing-engine/`

**Do not build:** Runtime v3 · Plugin v4 · Registry v2 · EventBus++ · Meta Registry · AI Core · any new orchestration layer above `CapabilityRuntime`.

---

## Rule #1 (non-negotiable)

> **No new infrastructure may be added unless an existing capability cannot reasonably support it.**

If a need can be expressed as a capability or plugin on the current runtime, that is the only allowed path. Architectural additions require a **written design proposal** and **founder approval**.

---

## What gets built from now on

Everything is a **capability** — not a new platform layer.

```
Capability → Vehicle Intelligence
Capability → Property Intelligence
Capability → Fraud Intelligence
…
```

Roadmap shape:

```
Platform Complete
        ↓
Capabilities v1 → v2 → v3 → …
```

Not:

```
Platform → Platform → Platform → Platform
```

### Capability roadmap (illustrative — not a build order)

Intelligence families that ship as capabilities over time, for example:

- VIN · Vehicle History · Property Valuation · Fraud · Trust · Pricing  
- Inspection · Document · Media · Negotiation · Search · Recommendation  
- Delivery · Escrow  

### Capability marketplace (north star)

Installed knowledge and providers (Vehicle Knowledge, Property Knowledge, VIN Decoder, OCR, Escrow, Inspection, Insurance, Financing, Flood Risk, School Rating, Neighborhood Intelligence, OpenAI, Claude, Gemini, …) — **YIP never changes**; only what is installed does.

### New verticals without rewrites

| Product | Install capabilities (examples) |
|---------|----------------------------------|
| Yike Agriculture | Crop, Soil, Farm Pricing, Weather, Equipment |
| Yike Jobs | Resume, Salary, Company, Interview, CV OCR |
| Yike Boats | Marine Registry, Boat Specs, Engine, Waterway |

Stable core. Thousands of capabilities. Same pattern as Stripe, AWS, VS Code, Kubernetes.

---

## Constitutional principles

### 1. Core must remain stable

KERNEL + PluginHost + CapabilityRuntime are frozen as the platform foundation. Extend files in place when a runtime concern already has an owner; do not invent parallel systems.

### 2. Capabilities evolve

Business value ships as versioned capabilities and plugins. The platform version stays quiet.

### 3. Applications depend on capabilities — never implementations

`src/app/**` and UI talk to registry contracts / runtime façades — not to a concrete provider or plugin internals.

### 4. Providers are replaceable

Swap OpenAI ↔ Claude ↔ Gemini (or local heuristics) behind the same capability contract without rewriting apps.

### 5. Every business feature is a capability

If it is product intelligence or a marketplace skill, it is a capability (or a thin UI over one) — not a new subsystem with its own bus, registry, or runtime.

### 6. Every capability is independently testable

Unit/integration tests live with the capability. The platform suite stays green without requiring every plugin installed.

### 7. Everything communicates through contracts

Typed capability interfaces, events, and manifests — not ad-hoc imports across layers.

### 8. The platform thinks before the user thinks

Intelligent Marketplace OS: automate and suggest when confident; progressive disclosure; one fact once; never invent metrics. See `docs/product/INTELLIGENT_MARKETPLACE.md`.

### 9. Knowledge is separated from decisions

Knowledge Layer / catalogs feed capabilities; decisioning (ranking, trust, pricing actions) stays behind capability contracts so knowledge can grow without rewriting decision UIs.

### 10. The platform should become simpler over time, not more complex

Prefer deletion, consolidation, and reuse over new abstractions.

### 11. Every architectural addition must eliminate complexity somewhere else

If it only adds complexity, it does not belong.

### 12. New marketplace categories through configuration and capabilities, not rewrites

Categories, catalogs, and vertical intelligence extend via metadata + plugins — not a fork of the listing engine or a second YIP.

---

## Architecture freeze discipline

| Allowed without founder architecture review | Requires written proposal + founder approval |
|---------------------------------------------|-----------------------------------------------|
| New / upgraded **capabilities** and **plugins** on existing runtime | New infrastructure layer or parallel kernel/runtime/host |
| Bugs, security, performance, launch polish | Replacing EventBus, Registry, PluginHost, or CapabilityRuntime |
| Docs and tests for the frozen core | "Cleaner" rewrite of the core because a different pattern feels nicer |
| Listing-engine catalog / UI polish within Engine-1 | Second listing engine or metadata OS |

**Demonstrated architectural limitation** (cannot reasonably ship as a capability) is the only reason to reopen the core — and only with founder approval.

---

## Related authority

| Doc | Role |
|-----|------|
| [YIP_RUNTIME.md](./YIP_RUNTIME.md) | Last infrastructure layer — STOP HERE |
| [YIKE_INTELLIGENCE_PLATFORM.md](./YIKE_INTELLIGENCE_PLATFORM.md) | YIP CORE |
| [YIP_PLUGIN_ARCHITECTURE.md](./YIP_PLUGIN_ARCHITECTURE.md) | Plugin contract |
| [METADATA_LISTING_ENGINE.md](./METADATA_LISTING_ENGINE.md) | Listing engine standard |
| [FEATURE_FREEZE.md](../launch/FEATURE_FREEZE.md) | Launch merge gate (product) |
| [PLATFORM_FREEZE.md](../engineering/PLATFORM_FREEZE.md) | Deploy/infra host freeze (Coolify) |
| `.cursor/rules/platform-constitution.mdc` | Agent enforcement |

---

**One-line summary**

**Platform complete. Capabilities forever. YIP does not change — what you install does.**

---

## Activation (pre-launch)

Architecture freeze does not mean “stop shipping.” It means ship through the [Enterprise Activation Program](../launch/ENTERPRISE_ACTIVATION_PROGRAM.md) and [Capability Lifecycle](./CAPABILITY_LIFECYCLE.md): certify Group 1, build Group 2 dark, register Group 3 plugins, keep Group 4 out of the marketplace core.
