# Ecosystem Alignment — Yike

**Status:** Approved baseline (Architecture Audit 2026-07-22)  
**Role:** Stankings Marketplace Platform  
**Supabase:** `hlpojfurfldvcxfxhveg`

Yike **consumes** shared Stankings infrastructure. It does **not** duplicate
Passport, Identity, Constitutional Trust, Governance, Payments, or Community.

## Canonical sources (do not fork)

| Concern | Authority | Location (ecosystem) |
|---------|-----------|----------------------|
| Corporate / group structure | Stankings Legacy | `stankings/docs/architecture/CORPORATE_ARCHITECTURE.md` |
| Ecosystem lanes | Stankings Legacy | `stankings/docs/architecture/ECOSYSTEM.md` |
| Passport | Stankings Passport / BamSignal first consumer | BamSignal `docs/architecture/STANKINGS_PASSPORT.md` |
| Digital Trust model | Shared | BamSignal `docs/architecture/DIGITAL_TRUST_MODEL.md` |
| Passport ID format | Shared | BamSignal `docs/architecture/PASSPORT_IDENTIFIER_STANDARD.md` |
| Platform stack | Shared | This repo `docs/engineering/PLATFORM_STANDARD.md` (+ BamSignal twin) |
| Environment / health / logging | Shared | `docs/engineering/*_STANDARD.md` |

When standards diverge, **Stankings / BamSignal constitutional docs win**.
Yike adapts locally (marketplace UX) without rewriting the canon.

## What Yike owns

- Marketplace platform (multi-vertical)
- Listings lifecycle & media
- Discovery, search, hubs
- Seller & agency profiles
- Listing moderation
- Marketplace experience (feed, detail, WhatsApp CTAs, PWA)
- Marketplace trust **indicators** (presentation / contribution of signals)

## What Yike never owns

| Capability | Owner |
|------------|--------|
| Identity | Stankings Passport |
| Passport | Stankings Passport |
| Constitutional Trust Engine | Stankings Legacy (shared) |
| Governance / Constitution / Excellence | Stankings Legacy |
| Consent ledger / explainability canon | Passport / Shared Infrastructure |
| Payments / Escrow / Billing | BayRight |
| Community / social graph | BamSignal |
| Hospitality operations | Stankings Hotel & Suites |
| Manufacturing / supply | Shodis Industries |
| Property news / media | Stankings Times |

## Marketplace hierarchy

```text
Yike Marketplace Platform
    ├── Property Marketplace (Live)
    ├── Vehicle Marketplace (Launching — product surfaces; apply SSOT migration)
    ├── Commercial Assets (within property / expanding)
    ├── Future Marketplace Verticals (Reserved in registry)
    └── Marketplace Services
```

Runtime modules: `src/lib/marketplace/`, `src/lib/enterprise/adapters.ts`, `src/lib/launch-mode/`.

Vehicles are a **core vertical**. Enable/disable with `ENABLE_VEHICLE_MARKETPLACE` (default on).

## Launch-mode gating

Runtime registry: `src/lib/launch-mode/`. Prefer `isLaunchFeatureVisible()` for
deferred surfaces (`vehicle_marketplace`, `passport_ui`, `wallet`, `escrow`, …).

## Related Yike docs

- [PASSPORT_INTEGRATION_READINESS.md](./PASSPORT_INTEGRATION_READINESS.md)
- [PLATFORM_RESPONSIBILITIES.md](./PLATFORM_RESPONSIBILITIES.md)
- `docs/launch/` — operational checklists
- Architecture audit canvas (Cursor): `yike-architecture-readiness-audit.canvas.tsx`
