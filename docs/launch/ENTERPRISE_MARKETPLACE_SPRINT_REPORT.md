# Enterprise Marketplace Completion — Launch Readiness Sprint I

**Date:** 2026-07-22  
**Status:** Implemented for review — **Do NOT commit until approved**  
**Supabase:** `hlpojfurfldvcxfxhveg`  
**Migration (not applied in this pass):** `20260722180232_marketplace_listings_ssot.sql`

Yike is evolving into a **multi-vertical Enterprise Marketplace** that **consumes** Stankings enterprise capabilities via adapters — never local engines.

---

## 1. Marketplace Architecture Report

| Layer | Design |
|-------|--------|
| Physical store | `properties` table (preserves FKs, RLS, ops history) |
| Logical SSOT | `asset_type` + `attributes` + **`listings` view** |
| Vertical registry | `src/lib/marketplace/verticals.ts` |
| Vehicle specs | Config-driven `vehicle-specs.ts` (not hardcoded forms) |
| Enterprise | `src/lib/enterprise/adapters.ts` — contract/gate only |
| Launch gates | `src/lib/launch-mode` — Vehicles default **on** |

```text
Yike Marketplace Platform
  ├── Property (live)
  ├── Vehicle (launching — product surfaces added)
  └── Future verticals (reserved in registry)
```

**Property feed** filters `asset_type = PROPERTY OR null` so vehicles never pollute property search.

---

## 2. Listings SSOT Migration Report

| Item | Detail |
|------|--------|
| File | `supabase/migrations/20260722180232_marketplace_listings_ssot.sql` |
| Adds | `asset_type`, vehicle columns, `attributes` JSONB, indexes |
| View | `listings` (security_invoker) maps marketplace read model |
| Profiles | `account_type` check includes **`dealer`** |
| Apply | Pending founder approval — run via SQL Editor or `npm run db:push` after review |

**Compatibility:** Existing Property APIs continue writing `properties`. Vehicles write the same table with `asset_type=VEHICLE`. Favorites/reports FKs unchanged.

---

## 3. Property Marketplace Completion Report

| Capability | Status |
|------------|--------|
| Create / edit / moderate / search / save / WhatsApp | Retained (prior launch validation) |
| Isolation from vehicles | **Added** property-only query filter |
| Vertical switcher | Available on Vehicles (Property via `/search`) |
| Remaining polish | Edit re-queue, localStorage drafts, video worker — still known limitations |

Property remains launch-ready; not regressively redesigned.

---

## 4. Vehicle Marketplace Completion Report

| Surface | Status |
|---------|--------|
| Categories | car, suv, truck, van, motorcycle, commercial, heavy_equipment, boat |
| Specs registry | Reusable fields (make/model/year/trim/transmission/fuel/mileage/VIN/colors/body/drivetrain/engine/registration/financing) |
| Create API | `POST /api/agent/vehicles/create` |
| Create UI | `/agent/listings/new/vehicle` |
| Discovery | `/vehicles` + filters |
| Detail + similar | `/vehicles/[slug]` |
| Contact | WhatsApp/call via shared ContactButtons |
| Lex filter | Property / Vehicles / All on moderation queue |
| Dealer | `account_type=dealer` allowed; profile label on detail |
| Premium/featured | Uses existing `is_featured` flags on shared table |

**Depends on migration apply** before create/search work against production DB.

---

## 5. Marketplace UX Excellence Report

| Change | Notes |
|--------|-------|
| Vertical switcher | Property ↔ Vehicles without breaking bottom nav |
| Bottom nav | Unchanged (Home·Swipe·Search·Saved·Profile) — locked product rule |
| Empty states | Vehicles empty CTA to list |
| Trust killers addressed | Property/vehicle feeds separated; vehicles gated by feature flag |

Full UX polish of every property journey was not re-litigated; prior CONDITIONAL GO limitations still apply.

---

## 6. Marketplace Administration Report

| Item | Status |
|------|--------|
| Lex listings vertical filter | Added |
| Shared moderate/approve/hide | Works for vehicle rows (same status machine) |
| Dealers directory | Account type supported; dedicated dealer console deferred |
| Feature flags | Documented in `.env.example` |

---

## 7. Marketplace Infrastructure Report

| Module | Path |
|--------|------|
| Verticals | `src/lib/marketplace/verticals.ts` |
| Vehicle specs | `src/lib/marketplace/vehicle-specs.ts` |
| Listings façade | `src/lib/marketplace/listings.ts` |
| Feed query | `src/lib/marketplace/listings-query.ts` |
| Barrel | `src/lib/marketplace/index.ts` |
| Launch mode | `src/lib/launch-mode` |

Future verticals declared as `reserved` — configuration only, no product UI.

---

## 8. Enterprise Adapter Report

| Capability | Adapter posture |
|------------|-----------------|
| Identity / Passport / Trust / Consent / Explainability | Contract-only in `enterprise/adapters.ts` |
| Capability discovery / registration / governance | Documented unavailable/contract |
| Local engines | **None** — excluded by design |
| Passport UI | Still gated (`passport_ui` default off) |

When `@stankings/platform-sdk` ships, replace adapter bodies only.

---

## 9. Performance & Security Audit (delta)

| Check | Result |
|-------|--------|
| No enterprise engine duplication | Pass |
| Vehicle routes behind `isLaunchFeatureVisible` | Pass |
| Property query isolation | Pass |
| Webhook fail-closed / dockerignore (prior sprint) | Unchanged |
| Full perf re-audit | Partial — no bundle regression hunt this pass |

---

## 10. Future Vertical Readiness Report

Registry includes jobs, services, equipment, agriculture, hospitality, rentals, marine, aviation, businesses, digital_assets — all **reserved**. Architecture supports expansion via `asset_type` + `attributes` + vertical config without redesign.

---

## 11. Production Certification Report

| Gate | Status |
|------|--------|
| Typecheck | Run in sprint validation |
| Migration applied to production | **Pending review** |
| Vehicle E2E on production | Blocked until migration |
| Property regression | Filter added; smoke after deploy |
| Supabase identity | PASS `hlpojfurfldvcxfxhveg` |

---

## 12. Launch Readiness Scorecard

| Area | Score | Notes |
|------|------:|-------|
| Marketplace architecture | **78** | SSOT pattern landed |
| Property | **84** | Stable |
| Vehicle (code) | **70** | Needs migration + media UX polish |
| Vehicle (prod-ready) | **45** | Until migration applied + UAT |
| Enterprise consumption | **58** | Adapters only — correct |
| Lex multi-vertical | **72** | Filter live; dealer ops thin |
| **Overall marketplace platform** | **≈76%** | Up from ~74% property-only |

---

## 13. Technical Debt Register

1. Apply SSOT migration to production (P0 for Vehicles)  
2. Vehicle media: wire shared upload manager (not URL textarea only)  
3. Dealer storefront dedicated routes  
4. Soft-edit without full unpublish (Property)  
5. Wire Passport SDK when Stankings M10 ships  
6. Bottom-nav marketplace entry (optional; currently switcher)  
7. Favorites/reports naming still `property_id` (works; rename later)

---

## 14. Recommended Commit Plan (when approved)

1. Commit migration + marketplace foundation + vehicle surfaces + enterprise adapters + docs  
2. Apply migration on production (`hlpojfurfldvcxfxhveg`)  
3. Deploy Coolify  
4. Smoke: `/vehicles`, create vehicle → Lex approve → public detail + WhatsApp  
5. Confirm property search excludes vehicles  

**Do not commit until architectural review.**
