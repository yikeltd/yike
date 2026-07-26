# Metadata-Driven Listing Engine

**Status:** Architecture locked — **implementation standard** (permanent)  
**Date:** 2026-07-26 (revised with integrated implementation rules)  
**Authority:** Founder product direction  
**Standard level:** Enterprise production foundation  
**Product / UX contract:** [INTELLIGENT_LISTING_ENGINE.md](../launch/INTELLIGENT_LISTING_ENGINE.md)  
**Product OS:** [INTELLIGENT_MARKETPLACE.md](../product/INTELLIGENT_MARKETPLACE.md)  
**Freeze:** Docs + design only until FAT clearance or written founder override — [FEATURE_FREEZE.md](../launch/FEATURE_FREEZE.md)

---

## Permanent architectural decision

This Listing Engine is a **core foundation of Yike**, not a temporary refactor.

It becomes the **single source of truth** for every listing category:

- Vehicles · Properties · Electronics · Jobs · Services · Boats · Agriculture · Fashion · and future verticals

**No duplicated forms. No duplicated logic. No duplicated validation. No duplicated create UX.**

Every listing experience uses the same engine. Adding a category should require **configuration** (typed TypeScript), not another form codebase and not an architectural rewrite.

---

## Mission

The listing experience must **never** be hardcoded.

Do **not** build:

- `VehicleForm.tsx`
- `PropertyForm.tsx`
- `ElectronicsForm.tsx`
- category-specific wizards that fork business rules into React

Build **one** reusable intelligent listing engine powered entirely by metadata.

The UI renders dynamically from configuration. The engine does not “know what a vehicle is” — it only knows how to resolve and render metadata.

---

## Non-negotiable implementation rules

These rules determine whether the system is still maintainable six months (and six years) from now. Treat them as merge gates.

### 1. Metadata is strongly typed TypeScript — not database JSON

Store all category / field / rule definitions as **plain TypeScript configuration objects** in the repo.

| Do | Don’t (now) |
|----|-------------|
| `src/lib/listing-engine/categories/vehicle.ts` | Postgres / CMS JSON as the field graph SSOT |
| `as const` + exported types + `satisfies CategoryManifest` | Untyped runtime blobs |
| PR review + `tsc` + config validators | “Edit live in Lex” before the model is stable |
| Lazy `import()` of heavy catalogs | Ship every vertical’s options in the first paint |

**Why:** Category definitions are **application code**. They need type safety, IDE autocomplete, compile-time validation, git history, pull-request review, refactoring support, and version control.

Administrator-editable metadata may be introduced **later** for a subset of copy/options if product requires it. Until then: **configuration belongs in the codebase.** Keep engine types and field graphs in TypeScript even if options eventually move.

### 2. No hardcoded category conditionals

Never write vertical business logic as:

```ts
if (category === "vehicle") { ... }
if (isLand) { ... }
if (property) { ... }
```

Resolve behaviour from metadata (visibility, dependencies, suggestions, validation).

Conditional React is allowed **only** inside generic widgets (`input === "currency"`), never as category policy.

### 3. Business rules live in metadata

React components **render**. They do not decide:

- which fields appear  
- which options load  
- what is required  
- what to suggest  
- how to title the listing  

Those decisions come from manifests + resolver engines.

### 4. The UI is generic

`ListingEngine` must not encode domain knowledge of cars, flats, or phones.

It only:

1. Loads a category pack  
2. Resolves visible fields / options / autofill  
3. Renders field components  
4. Validates  
5. Submits via an adapter  

### 5. Future categories = configuration only

No second engine. No rewrite. New vertical = registry entry + manifest + catalogs + submission adapter.

---

## High-level architecture

```
Sell / verify gates (existing)
        ↓
ListingEngine
        ↓
Category metadata (TypeScript)
        ↓
MetadataResolver
        ↓
Dynamic renderer (sections + fields)
        ↓
ValidationEngine · DependencyEngine · SuggestionEngine · AutoFillEngine · PhotoEngine
        ↓
ReviewEngine
        ↓
SubmissionEngine → existing create adapters (no duplicate APIs)
```

### Component map (reusable, category-agnostic)

| Component / module | Responsibility |
|--------------------|----------------|
| `ListingEngine` | Shell: category → steps → preview → review → publish |
| `MetadataResolver` | Pure compute from manifest + values |
| `DynamicForm` | Renders a step |
| `DynamicSection` | Groups fields within a step |
| `DynamicField` / `FieldRenderer` | Switch on `input` type only |
| `ValidationEngine` | Execute metadata validators |
| `DependencyEngine` | Option graphs + invalidate dependents |
| `SuggestionEngine` | Catalog / infer suggestions |
| `AutoFillEngine` | Title, subtitle, description, SEO, tags, specs |
| `PhotoEngine` | Photo rules + shared media pipeline |
| `ReviewEngine` | Preview + checklist (not a second form) |
| `SubmissionEngine` | Adapter → existing create API |

Components must **never** contain category-specific business logic.

### Forbidden vs required

```
FORBIDDEN                         REQUIRED
─────────────────────────────     ────────────────────────────────
VehicleForm.tsx                   ListingEngine
PropertyForm.tsx                  categories/*.ts
ElectronicsForm.tsx               catalogs/*.ts
if (vehicle) { 400 lines }        adapters/*.ts
Duplicate create UX APIs          engines/*.ts (pure)
```

Reuse existing create endpoints via adapters (`/api/agent/listings/create`, `/api/agent/vehicles/create`, `/api/media/upload`). Do not invent parallel listing APIs per category.

---

## Rendering flow

```
1. Load lightweight category registry
2. Seller picks category → lazy-load CategoryManifest + catalogs
3. values = initialDefaults(manifest)
4. On each interaction:
     resolver.compute(manifest, values)
       → visible fields, options, suggestions, autofill patches
     DependencyEngine clears invalid downstream values
5. DynamicForm renders current step only
6. PhotoEngine enforces photo rules via ListingPhotoManager
7. ReviewEngine = buyer-accurate preview + checklist
8. ValidationEngine must pass
9. SubmissionEngine.adapter.toPayload(values) → create API
10. Success messaging only after API OK
```

Seller verification stays **outside** the engine (existing `/agent/verify` gate).

---

## Category configuration

Each marketplace category defines itself completely:

| Area | Examples |
|------|----------|
| Identity | `id`, name, icon, accent/primary colour token |
| Presentation | listing card rules, search rules, detail page rules |
| Flow | steps / sections, review rules |
| Fields | available fields + defaults |
| Rules | validation, visibility, dependencies |
| Intelligence | suggestions, autofill |
| Media | photo rules |
| Persist | submission adapter id |

The UI **reads** this. Nothing category-specific is hardcoded in components.

---

## Field configuration

Every field describes itself. Support at minimum:

| Property | Purpose |
|----------|---------|
| `id` | Stable field id |
| `label` / display name | UI |
| `input` | text, select, currency, location, photos, confirm_chips, … |
| `required` / optional | Validation when visible |
| `placeholder`, `description` | UX copy |
| `defaultValue` | Initial |
| `validation` | Metadata validators |
| `visible` | Visibility rules |
| `dependsOn` | Dependency / options source |
| `suggestion` | Suggestion provider |
| `autofill` | Confirm-only / recipe participation |
| `submitKey` | Payload / DB mapping |
| `search` | Filters, facets, card, detail |
| `admin` | Lex / ops mapping |
| `analytics` | Event property mapping |

**One source of truth** for create UX, search, cards, detail, admin, analytics, API, and exports — via field mappings, not parallel schemas.

---

## Metadata schema (TypeScript)

Illustrative — implement under `src/lib/listing-engine/`. Semantics are normative; names may refine.

```ts
export type CategoryRegistryItem = {
  id: ListingCategoryId;
  label: string;
  description?: string;
  icon?: string;                 // lucide name or asset key
  accentToken?: "gold" | "navy" | string;
  assetType: "VEHICLE" | "PROPERTY" | string;
  pack: string;                  // lazy import key
  enabled: boolean;
  card?: CardRules;
  search?: CategorySearchRules;
  detail?: DetailRules;
};

export type ListingCategoryId =
  | "vehicle"
  | "property"
  | "electronics"
  | "job"
  | "service"
  | "boat"
  | "agriculture"
  | "fashion"
  | "furniture"
  | "event"
  | "pet"
  | "business"
  | (string & {});

export type FieldInputType =
  | "text"
  | "textarea"
  | "number"
  | "currency"
  | "select"
  | "multiselect"
  | "boolean"
  | "year"
  | "location"
  | "photos"
  | "confirm_chips";

export type VisibilityRule =
  | { op: "always" }
  | { op: "equals"; field: string; value: string | number | boolean | Array<string | number> }
  | { op: "notEquals"; field: string; value: string | number | boolean }
  | { op: "truthy"; field: string }
  | { op: "falsy"; field: string }
  | { op: "and"; rules: VisibilityRule[] }
  | { op: "or"; rules: VisibilityRule[] }
  | { op: "rule"; id: string };

export type DependencyRule = {
  watch: string[];
  optionsFrom: string;
  clearIfInvalid?: boolean;
};

export type ValidationRule =
  | { type: "required" }
  | { type: "min" | "max"; value: number }
  | { type: "minLength" | "maxLength"; value: number }
  | { type: "pattern"; value: string; message?: string }
  | { type: "integer" }
  | { type: "when"; visible?: VisibilityRule; rules: ValidationRule[] }
  | { type: "rule"; id: string };

export type SuggestionSource =
  | { type: "static"; options: { value: string; label: string }[] }
  | { type: "catalog"; id: string }
  | { type: "infer"; id: string }
  | { type: "none" };

export type SearchMapping = {
  filterKey?: string;
  facet?: boolean;
  card?: "title" | "subtitle" | "meta" | "hidden";
  detail?: "primary" | "specs" | "hidden";
  api?: string;
  export?: string;
};

export type AdminMapping = {
  column?: string;
  filterable?: boolean;
  editable?: boolean;
};

export type ListingFieldDef = {
  id: string;
  label: string;
  input: FieldInputType;
  required?: boolean;
  placeholder?: string;
  description?: string;
  defaultValue?: unknown;
  advanced?: boolean;
  visible?: VisibilityRule;
  dependsOn?: DependencyRule;
  validation?: ValidationRule[];
  suggestion?: SuggestionSource;
  autofill?: { from?: string; confirmOnly?: boolean };
  submitKey?: string;
  search?: SearchMapping;
  admin?: AdminMapping;
  analytics?: string;
};

export type ListingStepDef = {
  id: string;
  title: string;
  description?: string;
  sections?: { id: string; title?: string; fieldIds: string[] }[];
  fieldIds?: string[];
};

export type PhotoRules = {
  min: number;
  max: number;
  requiredAngles?: string[];
  tips: string[];
  recommendedCover?: "first" | "sharpest";
  accept?: ("image/jpeg" | "image/png" | "image/webp")[];
  /** Tighten only; never loosen platform MEDIA_LIMITS */
  maxUploadBytes?: number;
  warnings?: string[];
};

export type AutofillConfig = {
  titleRecipe: string[];
  subtitleRecipe?: string[];
  descriptionRecipe?: "template_v1" | "llm_v2" | "off";
  seoTitleRecipe?: string[];
  seoDescriptionRecipe?: string[];
  tagsFrom?: string[];
  priceSuggestion?: "off" | "anomaly" | "comps_band_v2";
  photoChecklistFromTips?: boolean;
};

export type ReviewRules = {
  checklist: Array<"photos" | "price" | "location" | "details" | string>;
  showLivePreview: boolean;
  successMessageAfterSubmitOnly: true;
};

export type CategoryManifest = {
  id: ListingCategoryId;
  version: number;
  label: string;
  assetType: string;
  steps: ListingStepDef[];
  fields: ListingFieldDef[];
  photo: PhotoRules;
  autofill: AutofillConfig;
  review: ReviewRules;
  submitAdapter: "property" | "vehicle" | string;
  capabilities?: string[];
};
```

---

## Dependency engine

Fields understand relationships — **no hardcoded switch statements**.

Example:

```
vehicle_type → make → model → year → trim / transmission / fuel / colours
```

Behaviour:

1. Upstream change triggers `optionsFrom` recompute  
2. Downstream values that fail membership are cleared (`clearIfInvalid`)  
3. Impossible combinations never appear as selectable options  

Catalogs (e.g. `vehicle.models_for_make`) are TypeScript modules referenced by id.

---

## Visibility engine

Show only relevant fields — every rule from metadata.

| Context | Hide | Show |
|---------|------|------|
| Land | bedrooms, bathrooms, parking | survey, title, size, purpose |
| Apartment | land survey | bedrooms, bathrooms, parking, floor |
| Commercial | residential amenity walls | commercial use fields |

Promote today’s `listing-field-rules.ts` into visibility rules + named `rule` ids.

---

## Validation engine

Validation lives in metadata. Support:

- Required (only when visible)  
- Min / max / length  
- Regex  
- Named custom validators  
- Conditional (`when`)  
- Cross-field / dependency validation  

The renderer **executes** metadata; it does not invent rules.

Configuration errors (bad validator ids, broken refs) must fail in **development / CI**, not for the first seller in production.

---

## Suggestion engine

Configurable assistance only:

| Category | Example |
|----------|---------|
| Vehicle + Toyota | Suggest Camry, Corolla, Prado, Hilux |
| Camry | Suggest engine / fuel / transmission / drive / colours (catalog or infer) |
| Apartment | Suggest bedrooms / bathrooms / parking / amenities |
| Land | Suggest survey / title / purpose / zoning |

UI pattern: typeahead or **confirm chips** — seller confirms, does not invent from blank.

Never invent factory data without a catalog / infer provider behind the id.

---

## Autofill engine

Metadata-driven generation (seller reviews and edits):

| Output | Config |
|--------|--------|
| Listing title | `titleRecipe` |
| Subtitle | `subtitleRecipe` |
| Description | `descriptionRecipe` (`template_v1` now; `llm_v2` later) |
| Suggested specs | infer + confirm |
| Suggested price range | honest comps / anomaly only when data exists |
| Recommended tags | `tagsFrom` |
| Photo checklist | `photo.tips` |
| SEO title / description | recipes (deterministic) |

Stop overwriting after first manual edit of that field (existing vehicle title behaviour).

---

## Photo engine

Metadata defines per category:

- Min / max photos  
- Required / recommended angles  
- Recommended cover strategy  
- Accepted formats  
- Warnings  
- Compression: always via shared `src/lib/media/` — category may **tighten**, never bypass platform limits  

Reuse `ListingPhotoManager` + `/api/media/upload`. No second upload pipeline.

---

## Search / card / detail / admin mapping

Every field declares how it appears in:

- Listing card  
- Search & filters  
- Detail page  
- Admin  
- Analytics  
- API / exports  

Avoid a second drifting “search schema.” Field `search` / `admin` / `analytics` mappings are the SSOT.

---

## Future extensibility

Plug into the engine — **never** another listing flow:

| Capability | Hook |
|------------|------|
| VIN decoder | infer id → patch fields |
| Property valuation / market pricing | `priceSuggestion` provider |
| Inspection reports | optional step / capability |
| Vehicle history | advanced section + fetch |
| Mortgage / insurance | post-review add-ons |
| AI image analysis / OCR | PhotoEngine tips fulfilment |
| Document verification | capability + named validators |
| Future LLM copy | `descriptionRecipe: "llm_v2"` |

---

## Performance

- Strongly typed, tree-shakeable packs  
- Lazy-load category catalogs  
- Memoize resolver outputs `(categoryId, valuesFingerprint, stepId)`  
- Avoid duplicate catalog lookups  
- Field-level memoization; no full-form remount per keystroke  
- Keep first-paint registry tiny  

---

## Testing (config must fail in development)

Every category pack is validated automatically (unit + optional codegen/CI script):

Detect:

- [ ] Missing required field defs referenced by steps  
- [ ] Broken dependency `optionsFrom` / `watch` ids  
- [ ] Circular dependency graphs  
- [ ] Duplicate field / step ids  
- [ ] Invalid validator / rule ids  
- [ ] Broken suggestion / catalog mappings  
- [ ] Photo min &gt; max  
- [ ] Submit keys missing for required visible fields  

**Configuration errors fail during development and CI — never as silent runtime surprises.**

Also test:

- Visibility matrices (land vs apartment)  
- Adapter payloads match current create APIs  
- Autofill title recipe snapshots  

---

## Example configurations

### Vehicle (seed from existing catalogs)

See abbreviated shape in prior revision — implement from:

- `src/lib/marketplace/vehicle-specs.ts`  
- `src/lib/marketplace/vehicle-makes.ts`  

Photo tips: Front · Rear · Interior · Dashboard · Engine · Tyres  

Title recipe: `year`, `make`, `model`, `transmission`  

### Property (seed from existing rules)

- `src/lib/listing-field-rules.ts`  
- `src/constants/listingTypes.ts`, `propertyCategories.ts`  
- `src/lib/listing-form-copy.ts`  

Photo tips: Exterior · Living room · Kitchen · Bedrooms · Bathrooms · Compound  

Visibility: land hides room fields; apartment shows them.

### Electronics (demonstration only — not launch scope)

Same shell. New TS pack. `enabled: false` in registry until product opens the vertical.  
**Point:** zero `ElectronicsForm.tsx`.

---

## Migration plan

| Stage | Work | When |
|-------|------|------|
| **M0** | This standard + product engine doc | **Done** |
| **M1** | Types, resolver, config validators, unit tests | Post-FAT / override |
| **M2** | Vehicle pack + flagged shell on vehicle create route | After M1 |
| **M3** | Property pack + flagged shell on property create route | After M2 |
| **M4** | Choose page → category step inside engine | After parity |
| **M5** | Delete `ListingForm` / `VehicleListingForm` after FAT parity | Only when green |
| **M6** | Future verticals as packs only | As product opens |

**Do not execute M2–M5 during active launch FAT** unless founder writes an override.

Parity before deleting old forms: create + edit both verticals, photos, validation, title autofill, seller gates unchanged.

---

## Success criteria

| Criterion | Required |
|-----------|----------|
| One Listing Engine | ✓ |
| One dynamic renderer | ✓ |
| One metadata system (TS) | ✓ |
| Zero hardcoded category forms (end state) | ✓ |
| Zero duplicated business logic in React | ✓ |
| Future categories via configuration | ✓ |
| Type-safe implementation | ✓ |
| Config validated in CI / development | ✓ |
| Easily testable pure engines | ✓ |
| Maintainable for years | ✓ |
| No duplicate listing create APIs | ✓ (adapters only) |

---

## Related inventory (today)

| Piece | Path |
|-------|------|
| Vehicle field registry (seed) | `src/lib/marketplace/vehicle-specs.ts` |
| Make → model catalog | `src/lib/marketplace/vehicle-makes.ts` |
| Property visibility (seed) | `src/lib/listing-field-rules.ts` |
| Property form (migrate away) | `src/components/agent/listing-form.tsx` |
| Vehicle form (migrate away) | `src/components/marketplace/vehicle-listing-form.tsx` |
| Photos (keep) | `src/components/agent/listing-photo-manager.tsx`, `src/lib/media/*` |
| Product / UX contract | `docs/launch/INTELLIGENT_LISTING_ENGINE.md` |

---

## Final note

Architectural rules embedded here are **implementation law**, not afterthoughts.

When freeze lifts: **M1 first** (types + resolver + config tests), then vehicle pack, then property pack. Resist “one more hardcoded form.”

This engine is how Yike stays a single marketplace operating system as categories expand — clean, type-safe, testable, and built to enterprise production standards.
