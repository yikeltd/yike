# Intelligent Listing Engine

**Status:** Architecture locked (definitive seller listing OS)  
**Date:** 2026-07-26  
**Authority:** Founder product direction  
**Product OS:** [INTELLIGENT_MARKETPLACE.md](../product/INTELLIGENT_MARKETPLACE.md)  
**Phase 1 ship notes:** [INTELLIGENT_MARKETPLACE_EXPERIENCE.md](./INTELLIGENT_MARKETPLACE_EXPERIENCE.md)  
**Freeze:** [FEATURE_FREEZE.md](./FEATURE_FREEZE.md) — **docs + design only until founder override or post-FAT**  
**V2 automation depth:** [V2_BACKLOG.md](./V2_BACKLOG.md) (V2-16 … V2-20)  
**Engineering contract (schema, engines, migration):** [METADATA_LISTING_ENGINE.md](../architecture/METADATA_LISTING_ENGINE.md)

---

## Executive verdict

Yike’s listing advantage is **not ChatGPT**.

It is **Intelligent Listing Assistance**:

> The seller should never have to enter information that Yike already knows or can confidently infer.

That is how a 2027 marketplace feels: Apple clarity, Stripe speed, Airbnb confidence — not a 2020 classifieds wall of empty fields.

**Today:** Phase 1 progressive disclosure is already live (stepped forms, make→model, auto-title, type-based property fields, shared media pipeline).

**Next architecture:** One **metadata-driven listing engine** that renders Vehicle, Property, and future verticals from **typed TypeScript configuration** — not duplicate wizards, not database JSON. See [METADATA_LISTING_ENGINE.md](../architecture/METADATA_LISTING_ENGINE.md).

**Do not build the full engine during active FAT / feature freeze.** Finish Profile → Seller verify → Publish certification first. This document is the build contract for the post-certification (or founder-override) implementation.

---

## Golden rules (non-negotiable)

1. Never ask for what Yike already knows.  
2. Never ask for what Yike can confidently infer.  
3. Never show irrelevant fields.  
4. Never make the seller type factory specifications when a catalog can suggest them.  
5. Never make the seller repeat the same fact.  
6. Never invent market prices, ratings, or specs we do not have. Prefer omit over fake intelligence.  
7. Never start title or description from a blank page when known facts exist.  
8. Platform thinks first. Seller confirms second.

---

## Success metrics

| Metric | Target |
|--------|--------|
| Time to publish (first-time seller, complete listing) | **&lt; 2 minutes** |
| Average taps vs current dual forms | **−40%** |
| Characters typed vs current | **−70%** |
| Factory / catalog fields auto-filled when catalog covers make+model(+year) | **Whenever possible** |
| Blank mandatory fields at review | **Only unknowns** (price, condition, photos, local nuance) |

Validation method: timed founder FAT scripts + instrumented step timings (post-engine).

---

## One experience (product funnel)

```
Sell / List
    ↓
Seller verification (existing gate)
    ↓
New Listing
    ↓
Category: Vehicle | Property   (+ future: Jobs | Services | Electronics)
    ↓
Dynamic Form (metadata engine)
    ↓
Photos (shared ListingPhotoManager)
    ↓
Review (preview + checklist — not another form)
    ↓
Publish
```

**Rules**

- No duplicate flows.  
- No legacy parallel wizards long-term.  
- No separate “feel” for vehicle vs property beyond **category config**.  
- One UI shell. One step machine. Many vertical configs.

### Current → target mapping

| Today (live) | Target |
|--------------|--------|
| `/agent/verify` → `/agent/listings/choose` | Keep gates; chooser becomes **Category** step inside the engine |
| `/agent/listings/new` + `ListingForm` | Property config pack on one engine |
| `/agent/listings/new/vehicle` + `VehicleListingForm` | Vehicle config pack on one engine |
| `POST /api/agent/listings/create` | Keep (property payload adapter) |
| `POST /api/agent/vehicles/create` | Keep (vehicle payload adapter) |
| Shared `properties` table + `asset_type` | Keep as storage SSOT |

Create APIs stay vertical-specific adapters until a thin unified create façade is justified. **Do not invent new backend services** for Phase Engine-1.

---

## Architecture

### Layers

```
┌─────────────────────────────────────────────────────────────┐
│  ListingShell (one React experience)                        │
│  Category → Steps → LivePreview → Review → Publish          │
└───────────────────────────┬─────────────────────────────────┘
                            │ reads
┌───────────────────────────▼─────────────────────────────────┐
│  Category Manifest (metadata)                               │
│  fields · visibility · dependencies · suggestions · copy    │
│  photo tips · validation · title/description recipes        │
└───────────────────────────┬─────────────────────────────────┘
                            │ uses
┌──────────────┬────────────▼────────────┬────────────────────┐
│ Catalogs     │ Suggestion engine       │ Media intelligence │
│ makes/models │ autofill / confirm UX   │ compress · cover   │
│ locations    │ title · description     │ heuristics         │
│ specs/options│ price hint (honest)     │ photo checklist    │
└──────────────┴─────────────────────────┴────────────────────┘
                            │ submits via
┌───────────────────────────▼─────────────────────────────────┐
│  Existing adapters                                          │
│  /api/agent/listings/create · /api/agent/vehicles/create    │
│  /api/media/upload · submit-guard · duplicate-check         │
│  /api/pricing/analyze (property; extend later)              │
└─────────────────────────────────────────────────────────────┘
```

### Design principle: metadata over code paths

**Do not** grow `if (vehicle) … else if (property) …` forever.

**Do** define each vertical as a **Category Manifest**. The shell renders whatever the manifest declares. Adding Electronics or Jobs = new manifest + catalogs, not a new form codebase.

Vehicle already points the way: `src/lib/marketplace/vehicle-specs.ts` (`VEHICLE_SPEC_FIELDS`, `specsForCategory`). Property still uses imperative rules in `listing-form.tsx` + `listing-field-rules.ts` — those must be **extracted into the same manifest shape**.

---

## Dynamic field engine

### Category Manifest (conceptual schema)

```ts
type ListingCategoryId = "vehicle" | "property" | "electronics" | "job" | "service";

type FieldVisibility =
  | { when: "always" }
  | { when: "equals"; field: string; value: string | string[] }
  | { when: "not"; field: string; value: string | string[] }
  | { when: "fn"; id: string }; // named rule in registry

type ListingFieldDef = {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "boolean" | "year" | "currency" | "location" | "photos";
  required?: boolean;
  options?: { value: string; label: string }[];
  optionsFrom?: "make_models" | "states" | "lgas" | "areas" | "fuel_for_model" | string;
  dependsOn?: string[];          // recompute when these change
  visible?: FieldVisibility;
  suggest?: "catalog" | "infer" | "title" | "description" | "price_band";
  confirmOnly?: boolean;         // show as ✓ chips, not blank inputs
  column?: string;               // DB / payload mapping
  advanced?: boolean;            // collapsed until “More”
};

type ListingStepDef = {
  id: string;
  title: string;
  fields: string[];              // field keys
  next?: string | { when: FieldVisibility; step: string }[];
};

type CategoryManifest = {
  id: ListingCategoryId;
  label: string;
  assetType: "VEHICLE" | "PROPERTY" | string;
  entryPath?: string;            // migration / deep link
  createAdapter: "property" | "vehicle" | string;
  steps: ListingStepDef[];
  fields: ListingFieldDef[];
  photoTips: string[];           // recommended angles
  titleRecipe: string[];         // ordered fact keys
  descriptionRecipe?: "template_v1" | "llm_v2";
  priceIntelligence?: "off" | "anomaly" | "comps_band_v2";
};
```

### Progressive reveal

Never dump 20 fields.

1. Category  
2. Type / subtype (vehicle type or property type)  
3. Identity facts (make/model/year or beds/size)  
4. Confirm inferred specs  
5. Location cascade  
6. Price  
7. Photos  
8. Review  

Each step only mounts fields whose `visible` rules pass. Changing an upstream answer **recomputes** options and clears impossible downstream values.

### Property reshape examples

| Selection | Show | Hide |
|-----------|------|------|
| Land | Survey, title, size, purpose | Bedrooms, bathrooms, furnishing |
| Apartment | Beds, baths, parking, floor, furnishing | Land survey |
| Commercial | Use-type, floor area, parking, power | Residential amenity walls |
| Short let | Beds, baths, nights, house rules | Long-lease deposit essays |

Reuse logic already encoded in `src/lib/listing-field-rules.ts` — promote into manifest `visible` rules.

### Vehicle reshape examples

| Selection | Behaviour |
|-----------|-----------|
| Vehicle type | Filter `VEHICLE_SPEC_FIELDS` via `categories` (already) |
| Make | Load models from `vehicle-makes.ts` — no full page reload |
| Model | Suggest body, transmission, fuel, seats, drive, colours when catalog allows |
| Year | Drop impossible option sets for that make/model/year |

---

## Suggestion engine

### Modes

| Mode | UX | When |
|------|-----|------|
| **Auto-populate** | Field filled; seller can edit | High confidence (catalog exact match) |
| **Auto-suggest** | Chips / “Use this” | Medium confidence |
| **Confirm-only** | Pre-checked ✓ specs | Factory defaults for that variant |
| **Auto-hide** | Field not rendered | Irrelevant for type |
| **Auto-complete** | Typeahead from catalog | Makes, models, locations |

### Title generation (Phase 1 — already live)

Deterministic recipes — **not** LLM.

- Property: `buildSuggestedTitle` → `src/lib/listing-form-copy.ts` / `src/lib/title-normalize.ts`  
- Vehicle: `suggestTitle()` in `vehicle-listing-form.tsx`  

Engine target: one `buildTitle(manifest, values)` shared helper. Seller edits anytime; stop auto-overwrite after first manual edit (current vehicle behaviour).

### Description generation

| Phase | Behaviour |
|-------|-----------|
| **Engine-1 (allowed without LLM)** | Template sentences from known facts + existing `listing-writing-assist.ts` banks. Never invent features. |
| **V2-17** | Optional LLM draft — product surface, honesty review, freeze override |

Never ship fake long-form “AI” that invents “excellent condition” without seller input.

### Location intelligence

Reuse:

- `src/constants/nigeriaLocations.ts`  
- `src/constants/nigeriaLgas.ts`  
- `src/lib/location-search.ts`  
- Property UX: `ListingLocationSearch`

**Parity gap:** vehicle form still uses free-text state/city. Engine must use the **same location cascade** for all verticals.

Flow: State → LGAs → Cities/areas → popular districts for that city.

### Price intelligence

| Phase | Behaviour | Existing code |
|-------|-----------|---------------|
| **Honesty now** | Optional soft hint when `market_price_memory` has enough samples; never force | `POST /api/pricing/analyze`, `src/lib/pricing/*` |
| **Property form today** | Anomaly confirm dialog — not a “suggested list price” picker | `PriceConfirmDialog` |
| **Vehicle** | Not wired yet | Wire analyze adapter in Engine-1 if memory covers vehicles; else omit |
| **V2-18** | Productized “Similar listings around ₦X” band | Needs denser comps + UX copy |

Copy pattern (when data exists):

> Similar vehicles are listed around ₦18.5M  

Seller may ignore. Never block publish on ignoring.

---

## Auto-fill rules (priority order)

For any field:

1. **Seller profile / previous listing** (known phone, WhatsApp, default city) — if safe and relevant  
2. **Exact catalog match** (make+model+year → options)  
3. **Category defaults** (e.g. motorcycle hides “seats: 5”)  
4. **Inference from sibling fields** (automatic transmission → typical gear count omit)  
5. **Ask the seller**

If confidence is low → suggest, do not silently force.

---

## Photo intelligence

### Reuse (mandatory)

| Capability | Location |
|------------|----------|
| Client prepare | `src/lib/media/prepare-listing-upload.ts` |
| Upload API | `POST /api/media/upload` |
| Compress / WebP / sizes | `src/lib/media/image.ts`, `compress-image.ts` |
| Manager UI | `src/components/agent/listing-photo-manager.tsx` |
| Cover / reorder | `src/lib/media/items.ts` |
| Protection / watermark | `src/lib/media/protection/*` |

### Heuristics without external vision APIs (Engine-1)

Use metadata + cheap local checks (sharp / EXIF already in pipeline where available):

| Detect | Action |
|--------|--------|
| Too small / upscaled | Warn |
| Very low sharpness score | “This photo looks blurry” |
| Extreme portrait for exterior tip | Soft suggest landscape |
| Duplicate hash within session | Warn |
| No cover set | Auto-pick first sharpest landscape |
| Below `MIN_LISTING_IMAGES` | Block publish with clear checklist |

### Recommended shot lists (config, not hardcode)

**Vehicle:** Front · Rear · Interior · Dashboard · Engine · Tyres  

**Property:** Exterior · Living room · Kitchen · Bedrooms · Bathrooms · Compound  

Manifest `photoTips` drives checklist UI. Missing tip = soft suggestion, not hard fail (except minimum count).

### V2-20

Deeper vision (angle classification, stolen-image productization) stays backlog — see media roadmaps. Do not block listing engine on it.

---

## Live preview & review

### Live preview

As values change, render the **buyer card + detail summary** (reuse marketplace card / detail primitives). Instant. No second visual language.

### Review step

**Not** another long form.

- Large preview  
- Checklist: Photos · Price · Location · Details  
- Primary CTA: Publish  
- Only **after** submit: “Your listing has been submitted for review.”

### Copy cleanup (Engine-1 UX pass)

Remove mid-flow essays such as:

- Long moderation lectures  
- Drafts-save sermons  
- Verified-seller marketing blocks inside the form  
- “First listings…” walls  

Trust and moderation belong in gates **before** the engine and confirmation **after** publish — not as clutter between every field.

---

## Technical requirements

### Must

- One reusable shell (`ListingShell` or equivalent name)  
- Category manifests under something like `src/lib/listing-engine/manifests/`  
- Reuse catalogs, media, create adapters, submit-guard, duplicate-check  
- Support Vehicle + Property day one of engine cutover  
- Design for Jobs / Services / Electronics without rewriting the shell  

### Must not

- New LLM microservices during freeze  
- Duplicate photo pipelines  
- Parallel “v3 wizard” left beside old forms indefinitely  
- Invented comps or factory specs  
- Schema sprawl without need (prefer JSON specs columns already used for vehicles)  

### Migration strategy

1. Extract property field rules → `property` manifest (parity with current behaviour).  
2. Wrap vehicle specs + makes as `vehicle` manifest (mostly already declarative).  
3. Ship `ListingShell` behind a flag or route alias; keep old forms as fallback one release.  
4. Point `/agent/listings/choose` at Category step.  
5. Delete / archive duplicate form trees only after FAT parity.  

---

## Future AI integration points (honest)

| Slot | Input | Output | Gate |
|------|-------|--------|------|
| Description draft | Structured facts + seller notes | Editable paragraphs | V2-17 + founder OK |
| Trim / HP catalog | Make+model+year | Confirm chips | V2-16 curated data |
| Comps band | Location + attributes | Soft ₦ range | V2-18 density |
| Photo angle coach | Image bytes | Tip labels | V2-20 |
| Cross-listing prefill | Seller history | Defaults | Engine-1 / 1.5 |

Until those gates open, the product still feels intelligent via **catalogs, progressive disclosure, and confirm-not-type**.

---

## Validation plan

### Architecture review

- [ ] Manifest covers Vehicle + Property with no dead fields on Land vs Apartment  
- [ ] Location cascade shared  
- [ ] Title recipe shared  
- [ ] Photo tips per category  
- [ ] Create adapters unchanged contractually  

### Founder FAT (post-implementation)

- [ ] First listing &lt; 2 minutes  
- [ ] Make → models instant  
- [ ] Specs mostly confirm chips  
- [ ] Preview matches buyer view  
- [ ] Publish → moderation message only after success  
- [ ] No “Profile not found” / photo upload regressions on the path  

### Regression

- [ ] Edit existing property / vehicle still works  
- [ ] Draft resume (device) still works or is intentionally replaced  
- [ ] Seller verification gates unchanged  

---

## Implementation phases

| Phase | Scope | Freeze |
|-------|--------|--------|
| **Phase 1** | Progressive disclosure, dual stepped forms, make→model, auto-title, media reuse | **Shipped** |
| **Docs (this)** | Engine contract + metadata architecture | **Allowed now** |
| **Engine-0** | Extract manifests; no UX change | Post-FAT or override (low risk) |
| **Engine-1** | One shell, shared location, confirm-spec UX, copy cleanup, property price soft-hint parity, photo tips checklist | Founder override or post soft-launch |
| **V2-16…20** | Factory catalogs, LLM copy, comps bands, vision coach | Explicitly V2 |

---

## Final recommendation

1. **Treat this document as the definitive listing architecture.** Product and engineering decisions about seller create UX route through here.  
2. **Do not divert the current FAT track.** Profile, avatar, seller verification, and publish certification remain P0 for READY FOR LAUNCH.  
3. **When freeze lifts (or founder overrides):** implement **Engine-0 → Engine-1** before any LLM. The competitive “2027 feel” comes primarily from metadata-driven progressive assistance — not generative AI.  
4. **Anchor on existing vehicle config** (`vehicle-specs.ts`, `vehicle-makes.ts`) as the template; lift property to the same model.  
5. **Keep create + media APIs.** Intelligence is orchestration and UX, not a new backend platform.  
6. **Honesty always wins.** Soft price hints and template descriptions only when grounded.  

**Positioning line for the product:**

> Yike doesn’t ask sellers to be data-entry clerks. Yike already knows the market — sellers only confirm what’s true.

---

## Related files (inventory)

| Area | Path |
|------|------|
| Property form | `src/components/agent/listing-form.tsx` |
| Vehicle form | `src/components/marketplace/vehicle-listing-form.tsx` |
| Choose category | `src/app/agent/listings/choose/page.tsx` |
| Vehicle specs registry | `src/lib/marketplace/vehicle-specs.ts` |
| Make/model catalog | `src/lib/marketplace/vehicle-makes.ts` |
| Property field rules | `src/lib/listing-field-rules.ts` |
| Title / copy | `src/lib/listing-form-copy.ts`, `src/lib/title-normalize.ts` |
| Writing assist | `src/lib/listing-writing-assist.ts` |
| Locations | `src/constants/nigeriaLocations.ts`, `nigeriaLgas.ts`, `src/lib/location-search.ts` |
| Photos | `src/components/agent/listing-photo-manager.tsx`, `src/lib/media/*` |
| Price analyze | `src/app/api/pricing/analyze/route.ts`, `src/lib/pricing/*` |
| Create APIs | `src/app/api/agent/listings/create`, `.../vehicles/create` |
