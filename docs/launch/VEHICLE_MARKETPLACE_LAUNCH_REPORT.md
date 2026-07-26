# Vehicle Marketplace Launch Report

**Date:** 2026-07-26  
**Phase:** Launch Operations · Feature Freeze ACTIVE  
**Mandate:** Vehicles are the **Day-1 flagship** — do not disable  
**Command Center:** [LAUNCH_COMMAND_CENTER.md](./LAUNCH_COMMAND_CENTER.md)

---

## Recommendation

**CONDITIONAL GO for Vehicle Marketplace product surface** — engineering parity is launch-viable.

**Overall marketplace GO remains NO-GO** until founder clears supply, FAT, media smoke, and Auth C08 (same company-level blockers).

Do **not** set `ENABLE_VEHICLE_MARKETPLACE=false`. Code default is now **ON**. Coolify should keep `ENABLE_VEHICLE_MARKETPLACE=true` (or unset — default true).

---

## Scores

| Lens | Score | Notes |
|------|------:|-------|
| Feature parity (Property ↔ Vehicle) | **88%** | Create/search/detail/report/admin present |
| Production readiness (vehicle vertical) | **82%** | Flag ON; thin live inventory |
| Search readiness | **90%** | Core filters + More (year/transmission/fuel) wired |
| Security | **90%** | Same listing RLS / report / media gates |
| Media protection (vehicle upload) | **0% verified** | Registry still empty — founder smoke |
| Operational readiness | **70%** | Admin vertical filters exist; FAT pending |

**Vehicle GO / NO-GO (product):** **CONDITIONAL GO**  
**Company GO / NO-GO:** **NO-GO** (supply + FAT + C08 + C12)

---

## Configuration verified

| Location | Intended launch value | Action |
|----------|----------------------|--------|
| `src/lib/launch-mode/index.ts` | Default **true** | Updated this sprint |
| `.env.example` | `ENABLE_VEHICLE_MARKETPLACE=true` | Updated |
| Coolify production | **true** (or unset) | Founder confirm — prod `/vehicles` already **200** |
| Docs that said “disable vehicles” | Superseded | Command Center C11 **CLOSED / inverted** |

Emergency hide only: explicitly set `ENABLE_VEHICLE_MARKETPLACE=false`.

---

## Vehicles as primary category (this sprint)

Peer switchers reordered to **Vehicles | Properties**; default category **vehicle** when URL omits `category`. Deep links `?category=property` preserved.

### Files changed

| File | Change |
|------|--------|
| `src/lib/launch-mode/index.ts` | Vehicle flag default **ON** |
| `.env.example` | `ENABLE_VEHICLE_MARKETPLACE=true` |
| `src/lib/home/marketplace-category.ts` | Default parse → `vehicle` |
| `src/lib/discover/filters.ts` | Discover default category → `vehicle` |
| `src/components/home/marketplace-category-toggle.tsx` | Vehicles tab first + pill math |
| `src/components/marketplace/vertical-switcher.tsx` | Vehicles link first |
| `src/components/home/home-category-rail.tsx` | Vehicles chip first |
| `src/components/home/home-marketplace-experience.tsx` | Comment only |
| `src/components/discover/discover-experience.tsx` | Default vehicle when flag on |
| `src/app/(public)/discover/page.tsx` | Desktop fallback vehicles first |
| `src/app/agent/listings/choose/page.tsx` | Vehicle choice first |
| `src/lib/marketplace/verticals.ts` | Vehicle vertical first · status `live` |
| `src/app/(public)/agents/[slug]/page.tsx` | Vehicles inventory section first |
| `src/components/profile/profile-page-client.tsx` | CTA → “List on Yike” |
| `src/components/admin/ceo-dashboard.tsx` | Vehicle metrics before property |
| `src/components/marketplace/vehicle-search-panel.tsx` | Year / transmission / fuel in More |

### Screens affected

Homepage toggle · Search/Vehicles headers · Discover · Category rail · Seller choose-type · Agent storefront · Profile quick action · Lex CEO metrics

**Confirm:** Vehicles is now the primary marketplace category across the application.

---

## Feature parity audit

| Area | Property | Vehicle | Gap | Class |
|------|----------|---------|-----|-------|
| Creation | `/agent/listings/new` | `/agent/listings/new/vehicle` | Separate forms — intentional | Parity OK |
| Choose type | Property card | Vehicle card (now first) | — | Parity OK |
| Editing | Agent edit | Agent edit path | Same listings table | Parity OK |
| Publish / drafts / pending | Moderation status | Same | — | Parity OK |
| Search hub | `/search` | `/vehicles` | Separate URL by design | Parity OK |
| Filters | Beds/type/price/city | Make/model/year/price/condition/transmission/fuel/category/location/verified | Body-type dedicated control absent (category covers SUV/truck) | Minor |
| Sort | Newest/price | Newest/featured/price/mileage | — | Parity OK |
| Pagination | Yes | Yes (24/page) | — | Parity OK |
| Detail | `/properties/[slug]` | `/vehicles/[slug]` | Gallery, specs, WA, report, safety | Parity OK |
| Favorites / share | Shared | Shared via listing path | — | Parity OK |
| Reporting | Report form | Same component | — | Parity OK |
| Admin moderate | Lex vertical=property | Lex vertical=vehicle | — | Parity OK |
| Media upload | Protection pipeline | Same upload API + `assetType` | Live smoke not done | Launch blocker (ops) |
| Verification badges | Listing badges | Same resolver | — | Parity OK |
| Seller profile | Properties section | Vehicles section (now first) | — | Parity OK |
| Analytics | View tracker | Marketplace view tracker | — | Parity OK |
| Homepage rails | Property rails | Vehicle rails | Thin live vehicle inventory | Launch blocker (supply) |

**Launch blockers (vehicle-specific):** thin/sample vehicle inventory; media protection not production-verified on a vehicle upload.  
**Not blockers:** body-type UI control; Sentry; redesign ideas → [V2_BACKLOG.md](./V2_BACKLOG.md).

---

## Search parity

Supported on `/vehicles` (query + UI):

Make · Model · Year (min/max) · Price · Condition · Transmission · Fuel · Category (body-ish) · Location · Verified · Featured · Newest · Price asc/desc · Pagination

Deep-link filters without UI still work for `max_mileage` via URL.

---

## Listing quality / detail

`/vehicles/[slug]`: hero gallery, specs sections, price, seller contact, safety notice, report, similar vehicles, SEO title/description. Open Graph inherits listing URL helpers. Structured data: property-centric schemas may be thinner for vehicles — **Minor / V2**, not a Day-1 blocker.

---

## Media protection

| Check | Status |
|-------|--------|
| Pipeline supports `assetType: vehicle` | Code READY |
| Admin media API | 401 anon (OK) |
| `media_assets` count | **0** |
| Vehicle upload PRODUCTION VERIFIED | **No** |

Founder: follow [MEDIA_PROTECTION_PRODUCTION_SMOKE.md](./MEDIA_PROTECTION_PRODUCTION_SMOKE.md) using **Sell Vehicle** flow.

---

## Admin

Lex listings `?vertical=vehicle` · approve/reject shared · CEO vehicle metrics · media registry panel. Feature/report/verification use shared listing tools.

---

## Performance (prod probe baseline)

| Route | Latency |
|-------|--------:|
| `/vehicles` | ~0.85s |
| Property detail (prior) | ~1.1s |
| Search | ~1.0–1.2s |

No vehicle-specific regression fix required at current inventory size. Re-measure after staging seed / real supply growth.

---

## Production / validation data

| Source | Vehicles |
|--------|----------|
| Production approved with `auto_category` | **14** (sample) |
| Launch validation catalog | **~134** (seed script; staging preferred) |
| Makes in catalog | Toyota, Lexus, Honda, Mercedes-Benz, BMW, Ford, Kia, Hyundai, Nissan, Peugeot, Mitsubishi (+ handcrafted) |

Do **not** flood production with fakes — recruit dealers for real Day-1 trust.

---

## User journey status

| Step | Status |
|------|--------|
| Guest → `/vehicles` → detail | Eng READY (anon probe) |
| Gallery / seller / WA | Code READY |
| Login → create vehicle → upload → publish | FOUNDER FAT |
| Edit / report / admin moderate | FOUNDER FAT |
| Media registry after upload | FOUNDER C12 |

---

## Known issues

1. Live vehicle supply thin (sample-heavy).  
2. Media protection unverified on real vehicle photo.  
3. Body-type filter not a first-class UI control (category approximates).  
4. Company-level C07/C08/C10 remain open.

---

## Next founder actions (vehicle-first)

1. Coolify: confirm `ENABLE_VEHICLE_MARKETPLACE=true` (or unset).  
2. Upload one **vehicle** photo → media smoke.  
3. FAT vehicle path in [FOUNDER_ACCEPTANCE_TEST.md](./FOUNDER_ACCEPTANCE_TEST.md).  
4. Recruit dealers / vehicle sellers for 1–2 cities.  
5. Optional: seed **sandbox** with validation catalog for load QA.
