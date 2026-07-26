# Engine-1 Implementation — Intelligent Metadata Listing Engine

**Status:** M1–M3 shipped — vehicle + property create/edit on `ListingEngine`  
**Authority:** Founder freeze override (2026-07-26) — launch-critical for FAT  
**Architecture:** [METADATA_LISTING_ENGINE.md](../architecture/METADATA_LISTING_ENGINE.md)  
**Product:** [INTELLIGENT_LISTING_ENGINE.md](../launch/INTELLIGENT_LISTING_ENGINE.md)

---

## Founder override

Feature freeze exception is **ACTIVE** for this engine only. Build incrementally; reuse existing APIs/DB; no big-bang delete of legacy until FAT parity is confirmed.

---

## Architecture (modular)

Independent modules under `src/lib/listing-engine/` — **not** one mega class:

| Module | Role |
|--------|------|
| `types.ts` | Manifest + field schema |
| `visibility.ts` | Show/hide fields |
| `dependency.ts` | Cascading options + clears |
| `validation.ts` | Metadata validators |
| `suggestion.ts` | Catalog / static suggestions |
| `autofill.ts` | Title recipes |
| `photo.ts` | Photo checklist vs rules |
| `resolver.ts` | Pure compute orchestrator |
| `validate-config.ts` | CI/dev config guard |
| `catalogs/*` | Option providers |
| `categories/*` | TS manifests (vehicle, property) |
| `rules/registry.ts` | Named visibility rules |
| `adapters/*` | Payload → existing create APIs |
| UI: `components/listing-engine/*` | Generic shell + field renderer |

Capabilities plug in as modules. Improving price suggestions later does not require rewriting the shell.

---

## Migration stages

| Stage | Work | Status |
|-------|------|--------|
| M0 | Architecture docs | Done |
| M1 | Engine + manifests + tests | Done |
| M2 | Vehicle create/edit → `ListingEngine` | Done |
| M3 | Property create/edit → `ListingEngine` | Done |
| M4 | Choose page copy (category-first) | Done (light) |
| M5 | Delete `ListingForm` / `VehicleListingForm` | **Deferred** until founder FAT parity |
| M6 | Future verticals as packs only | Later |

**Live routes**

- `/agent/listings/new/vehicle` → `ListingEngine` `categoryId="vehicle"`
- `/agent/listings/new` → `ListingEngine` `categoryId="property"`
- `/agent/listings/[id]/edit` → engine for both asset types

**Legacy files retained** (unused by routes) for emergency rollback during FAT:

- `src/components/agent/listing-form.tsx`
- `src/components/marketplace/vehicle-listing-form.tsx`

---

## Metadata schema

Plain **TypeScript** `CategoryManifest` objects — not database JSON. See `types.ts` and category packs.

---

## Engine responsibilities

- Resolve visibility / options / autofill from metadata  
- Validate visible fields only  
- Photo tips + min/max checklist (shared `ListingPhotoManager` for upload/compress)  
- Live buyer-style preview while editing  
- Review checklist → Publish  
- Submit via adapters to existing `/api/agent/vehicles/create` and `/api/agent/listings/create`

---

## Testing

```bash
npm run test:listing-engine
```

28 unit tests: visibility, dependency, validation, autofill, photo, resolver, config validator, adapters.

Config errors (duplicate ids, circular deps, broken refs) fail in tests / `validateCategoryManifest`.

---

## Known risks / gaps for FAT

| Risk | Mitigation |
|------|------------|
| Property flow thinner than old form (fees, value drivers, spam guard UI, writing assist banks) | Gates + submit-guard still on API; expand manifest fields post-FAT if needed |
| Price comps soft-hint not in UI yet | Honesty: only when data exists — wire later via Autofill/Suggestion module |
| `infer` suggestion providers stubbed | Catalogs cover make→model; factory trim catalogs are V2 |
| Legacy forms still in tree | Delete only after FAT confirms &lt;2 min publish for both verticals |
| Property draft autosave not ported | Vehicle draft retained; property can re-add as module |

---

## Validation (founder FAT)

- [ ] Vehicle: category → make → model cascade → specs confirm → location → photos → review → publish  
- [ ] Property: listing type → property type → land hides bedrooms → location cascade → photos → publish  
- [ ] Live preview updates  
- [ ] Title autofills until edited  
- [ ] Success message only after submit  
- [ ] Edit existing vehicle + property  
- [ ] No regressions on media upload / seller verify gates  

**Target:** both listing types under **2 minutes**.

---

## Rollout checklist

1. Coolify deploy from `main`  
2. Founder FAT on vehicle + property create  
3. If green → open M5 PR deleting legacy forms  
4. If blocked → temporary rollback by re-pointing pages to legacy components (files still present)  

---

## Non-negotiables (reminder)

1. Typed TS config, not DB JSON  
2. No `if (vehicle)` business logic in engines/UI shell  
3. Business rules in metadata (+ named rule ids)  
4. One engine, category-agnostic  
5. Modular capabilities  
6. Reuse existing backend  
