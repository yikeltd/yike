# Document 06 — Dependency Graph Specification

**Technical Authority:** Subsystem Dependency & Layering Architecture  
**Governance Scope:** Directed Acyclic Graph (DAG), Allowed Call Directions, Circular Dependency Prevention  
**Status:** Frozen Architecture Baseline (Yike V2 Phase 0.75)  

---

## 1. The Directed Acyclic Graph (DAG) Mandate

Platform dependencies in Yike MUST form a strict **Directed Acyclic Graph (DAG)**. 

- **Rule 1**: Dependencies flow downwards from High-Level Application Domains to Foundation Utility Domains.
- **Rule 2**: Lower-level platforms MUST NEVER import, call, or depend on higher-level platforms.
- **Rule 3**: Circular dependencies between platforms (e.g. `Discovery` calling `Trust` while `Trust` calls `Discovery`) are **STRICTLY FORBIDDEN**. Cross-domain updates MUST occur asynchronously via the `Yike Event Bus`.

---

## 2. Platform Layering Topology

```
┌────────────────────────────────────────────────────────────────────────┐
│ LEVEL 4: APPLICATION & OPERATIONAL LAYER                               │
│ Operations Platform (/lex), Seller Success Platform                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Calls Downward)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ LEVEL 3: DOMAIN WORKFLOW LAYER                                         │
│ Communication Platform, Commerce Platform, Trust Platform, Revenue P. │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Calls Downward)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ LEVEL 2: CORE MARKETPLACE LAYER                                        │
│ Discovery Platform, Search Platform, Analytics Platform                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Calls Downward)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ LEVEL 1: FOUNDATION INFRASTRUCTURE LAYER                               │
│ Identity Platform, Media Platform, Notification Platform               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Allowed vs. Forbidden Dependency Matrix

| Calling Platform | Allowed Target Platforms | FORBIDDEN Targets (Circular / Inverted Risk) |
|------------------|--------------------------|---------------------------------------------|
| **Operations (`/lex`)** | All Platforms (Level 1–3) | None (Admin Orchestrator Layer) |
| **Seller Success** | Discovery, Communication, Revenue, Identity | Operations Platform |
| **Communication** | Discovery, Identity, Notification | Seller Success, Operations Platforms |
| **Trust** | Identity, Media, Operations | Discovery, Commerce Platforms |
| **Revenue** | Identity, Commerce | Seller Success, Operations Platforms |
| **Discovery** | Identity, Search, Media, Trust (Query Only) | Communication, Revenue, Operations |
| **Identity** | None (Base Infrastructure) | ALL Higher-Level Platforms (Level 2–4) |
| **Media** | None (Utility Infrastructure) | ALL Higher-Level Platforms (Level 2–4) |
| **Notification** | Identity, Media | ALL Higher-Level Platforms (Level 2–4) |

---

## 4. Resolving Inverted Dependencies via Event Bus

When a lower-level platform needs to trigger an action in a higher-level platform:
- **INCORRECT (Forbidden Call)**: `Discovery Platform` directly imports `NotificationService` to send a marketing email when a listing is created.
- **CORRECT (Event-Driven Integration)**: `Discovery Platform` emits `ListingCreated` event. `Notification Platform` listens for `ListingCreated` and independently dispatches the notification.
