# Metadata-Driven Listing Engine

**Status:** Architecture locked (engineering contract)  
**Date:** 2026-07-26  
**Authority:** Founder product direction  
**Product / UX contract:** [INTELLIGENT_LISTING_ENGINE.md](../launch/INTELLIGENT_LISTING_ENGINE.md)  
**Product OS:** [INTELLIGENT_MARKETPLACE.md](../product/INTELLIGENT_MARKETPLACE.md)  
**Freeze:** Docs only until FAT clearance or written founder override — [FEATURE_FREEZE.md](../launch/FEATURE_FREEZE.md)

---

## Why this decision matters

If listing UX is hardcoded per vertical (`VehicleForm`, `PropertyForm`, `ElectronicsForm`…), every new category forces a rebuild.

If listing UX is **metadata-driven**, adding a category is mostly:

1. A typed TypeScript category pack  
2. Catalogs (options / dependencies)  
3. A submission adapter (map values → existing create API / table shape)

**No new form tree. No duplicated step machines. One engine for years.**

This document is the **engineering source of truth** for that engine. The launch doc covers product feel, metrics, and phasing; this doc covers schema, data flow, engines, and migration.

---

## Hard implementation rule — TypeScript config, not database JSON

**Category definitions live as plain TypeScript modules in the repo.**

| Do | Don’t (for now) |
|----|-----------------|
| `src/lib/listing-engine/categories/vehicle.ts` | Store field graphs in Postgres JSON for admin editing |
| `as const` + exported types | Runtime schema from CMS without review |
| PR review + `tsc` for every category change | “Edit live config in Lex” before the model is stable |
| Lazy `import()` of heavy catalogs | Bundle every vertical’s options into the first paint |

**Why**

- Fields, dependencies, and validation **change with product code**  
- TypeScript gives autocomplete, exhaustiveness, and compile-time safety  
- Code review catches impossible configs before production  
- Version control is the audit trail  

**Later (years out):** if non-engineers must edit categories without deploy, promote a *subset* of options/copy into DB while keeping the **engine + field graph types** in code. Do not start there.

Existing precedent already in-repo: `src/lib/marketplace/vehicle-specs.ts`, `vehicle-makes.ts`, `src/lib/listing-field-rules.ts`.

---

## Mission

Never hardcode listing experiences per marketplace category.

Build **one** reusable pipeline:

```
ListingEngine
    → Category configuration (TS)
    → MetadataResolver
    → Dynamic renderer (steps + fields)
    → ValidationEngine
    → SuggestionEngine / AutofillEngine
    → SubmissionEngine (adapters)
```

UI renders from configuration. Adding Jobs, Services, Electronics, Agriculture, Fashion, etc. should require **little or no new frontend form code** — only configuration (+ catalogs + adapter).

---

## Architecture diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         ListingShell                             │
│   Category picker → Stepper → Live preview → Review → Publish  │
└─────────────────────────────┬────────────────────────────────────┘
                              │
                    MetadataResolver(categoryId, values)
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
  visibleFields()      optionsFor(field)     autofillPatches()
         │                    │                    │
         ▼                    ▼                    ▼
  FieldRenderer  ←── SuggestionEngine  ←── catalogs (TS)
         │
         ▼
  ValidationEngine.validate(values, manifest)
         │
         ▼
  SubmissionEngine → property | vehicle | future adapters
         │
         ▼
  Existing APIs (/api/agent/listings/create, /vehicles/create, /media/upload)
```

### Forbidden shapes

```
VehicleForm.tsx
PropertyForm.tsx
ElectronicsForm.tsx
if (category === "vehicle") { ... 400 lines ... }
```

### Required shapes

```
ListingEngine
DynamicForm / FieldRenderer
categories/*.ts          // manifests
catalogs/*.ts            // makes, models, locations, …
adapters/*.ts            // payload mappers
engines/*.ts             // visibility, dependency, validation, suggestion, autofill
```

Conditional React is allowed only inside **generic** field widgets (e.g. `type === "currency"`), never as vertical business logic.

---

## Data flow

```
1. Seller opens New Listing
2. Shell loads category registry (lightweight index)
3. On category select → lazy-load CategoryManifest + catalogs
4. values = {}
5. Loop:
     a. resolver.compute(manifest, values) → { steps, fields, options, suggestions, autofill }
     b. render current step fields
     c. onChange → update values → clear invalidated dependents → recompute
6. Photos step uses manifest.photoRules + shared ListingPhotoManager
7. Review = preview + validation summary (not a second form)
8. Submit → adapter.toPayload(values) → existing create API
9. Success copy only after API OK
```

Seller gates (`/agent/verify`) stay **outside** the engine. The engine starts at category selection.

---

## Metadata schema (TypeScript)

Illustrative types — implement under `src/lib/listing-engine/` when building. Names may refine; semantics must hold.

```ts
/** Registry entry — keep index small for first paint */
export type CategoryRegistryItem = {
  id: ListingCategoryId;
  label: string;
  description?: string;
  assetType: "VEHICLE" | "PROPERTY" | string;
  /** Dynamic import path key */
  pack: "vehicle" | "property" | "electronics" | string;
  enabled: boolean; // launch flags may gate
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
  | "confirm_chips"; // suggestion confirm UX

export type VisibilityRule =
  | { op: "always" }
  | { op: "equals"; field: string; value: string | number | boolean | Array<string | number> }
  | { op: "notEquals"; field: string; value: string | number | boolean }
  | { op: "truthy"; field: string }
  | { op: "falsy"; field: string }
  | { op: "and"; rules: VisibilityRule[] }
  | { op: "or"; rules: VisibilityRule[] }
  | { op: "rule"; id: string }; // named fn in rules registry

export type DependencyRule = {
  /** When these change, recompute options / clear this field if invalid */
  watch: string[];
  /** Catalog or resolver id that returns option list */
  optionsFrom: string;
  /** If current value not in new options → clear */
  clearIfInvalid?: boolean;
};

export type ValidationRule =
  | { type: "required" }
  | { type: "min"; value: number }
  | { type: "max"; value: number }
  | { type: "minLength"; value: number }
  | { type: "maxLength"; value: number }
  | { type: "pattern"; value: string; message?: string }
  | { type: "integer" }
  | { type: "rule"; id: string }; // named validator

export type SuggestionSource =
  | { type: "static"; options: { value: string; label: string }[] }
  | { type: "catalog"; id: string } // e.g. "vehicle.models_for_make"
  | { type: "infer"; id: string }   // e.g. "vehicle.specs_for_variant"
  | { type: "none" };

export type SearchMapping = {
  filterKey?: string;       // URL / search param
  facet?: boolean;
  card?: "title" | "subtitle" | "meta" | "hidden";
  detail?: "primary" | "specs" | "hidden";
  admin?: boolean;
  analytics?: string;       // event property name
};

export type ListingFieldDef = {
  id: string;
  label: string;
  input: FieldInputType;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  defaultValue?: unknown;
  advanced?: boolean;
  visible?: VisibilityRule;
  dependsOn?: DependencyRule;
  validation?: ValidationRule[];
  suggestion?: SuggestionSource;
  autofill?: {
    from?: "title_recipe" | "description_recipe" | "profile" | "infer";
    confirmOnly?: boolean;
  };
  /** DB / API field path */
  submitKey?: string;
  search?: SearchMapping;
};

export type ListingStepDef = {
  id: string;
  title: string;
  description?: string;
  fieldIds: string[];
};

export type PhotoRules = {
  min: number;
  max: number;
  recommendedCover?: "first" | "sharpest";
  requiredAngles?: string[]; // soft checklist ids
  tips: string[];
  accept?: ("image/jpeg" | "image/png" | "image/webp")[];
  /** Always defer to MEDIA_LIMITS + shared pipeline; category may only tighten */
  maxUploadBytes?: number;
};

export type AutofillConfig = {
  titleRecipe: string[];          // ordered field ids
  descriptionRecipe?: "template_v1" | "off";
  priceSuggestion?: "off" | "anomaly" | "comps_band_v2";
  photoChecklistFromTips?: boolean;
};

export type CategoryManifest = {
  id: ListingCategoryId;
  version: number;                // bump when breaking field ids
  label: string;
  assetType: string;
  steps: ListingStepDef[];
  fields: ListingFieldDef[];
  photo: PhotoRules;
  autofill: AutofillConfig;
  submitAdapter: "property" | "vehicle" | string;
  /** Named rule/validator/catalog ids this pack needs */
  capabilities?: string[];
};
```

### Source of truth hierarchy

1. **CategoryManifest** — behaviour for create/edit UX  
2. **Catalogs** — option graphs (makes→models, locations)  
3. **Adapters** — persistence mapping  
4. **SearchMapping on fields** — how attributes surface in browse/detail/admin  

Avoid a second “search schema” that drifts from listing fields.

---

## Engine responsibilities

### MetadataResolver

Pure functions (easy to unit test):

- `getVisibleFields(manifest, values)`  
- `getStepFields(manifest, stepId, values)`  
- `getOptions(field, values, catalogs)`  
- `applyAutofill(manifest, values) → patch`  
- `invalidateDependents(changedKey, values, manifest) → values`

No React. No I/O.

### Dependency engine

Example chain:

```
vehicle_type → make → model → year → trim / transmission / fuel / colours
```

Rules:

- Changing an upstream key clears downstream values that fail `clearIfInvalid`  
- Options for a field come only from `dependsOn.optionsFrom` + current values  
- Impossible combinations never appear in the select list  

### Visibility engine

Example:

| Context | Hide | Show |
|---------|------|------|
| Land | bedrooms, bathrooms, parking, furnishing | survey, title, size, purpose |
| Apartment | land survey | bedrooms, bathrooms, parking, floor |
| Commercial | residential amenity walls | commercial use, floor area |

Encode today’s `listing-field-rules.ts` as `VisibilityRule` trees + named `rule` ids where logic is non-trivial.

### Validation engine

- Run all `validation[]` for visible required fields at step advance and at publish  
- Hidden fields are not required  
- Named rules for cross-field checks (e.g. land must have size)  
- No vertical-specific `if (isLand)` inside React submit handlers — call `ValidationEngine.validate`

### Suggestion engine

Configurable sources only:

- Static options on the field  
- Catalog id (`vehicle.models_for_make`)  
- Infer id (`vehicle.factory_hints`) — returns suggestions; UI shows confirm chips  

Never invent factory data without a catalog behind the infer id.

### Autofill engine

Manifest-driven:

| Output | Config |
|--------|--------|
| Title | `autofill.titleRecipe` |
| Description | `descriptionRecipe: template_v1` (deterministic templates) |
| Price hint | `priceSuggestion` + existing `/api/pricing/analyze` when honest |
| Specs | infer + `confirmOnly` |
| Photo checklist | `photo.tips` |

LLM / VIN decode / valuation plug in later as **new suggestion source types** or named infer ids — shell unchanged.

### Submission engine

```
values + manifest → adapter.toPayload() → fetch(createUrl)
```

Keep existing endpoints:

- Property → `POST /api/agent/listings/create`  
- Vehicle → `POST /api/agent/vehicles/create`  

Unified façade is optional later; adapters isolate the engine from API churn.

---

## Field renderer

One component family:

| Component | Role |
|-----------|------|
| `ListingEngine` | Shell, steps, preview, submit |
| `DynamicForm` | Renders a step’s fields |
| `FieldRenderer` | Switch on `input` type only |
| `ConfirmChipsField` | Suggestion confirm UX |
| `LocationField` | Shared state → LGA → area (all verticals) |
| `PhotosField` | Wraps `ListingPhotoManager` + photo rules |

**Bundle discipline**

- Registry of categories is tiny  
- Heavy catalogs: `await import("@/lib/listing-engine/catalogs/vehicle-makes")`  
- Memoize resolver outputs keyed by `(categoryId, valuesFingerprint, stepId)`  
- Avoid re-creating option arrays when upstream unchanged  

---

## Example configurations

### Vehicle (abbreviated)

```ts
export const vehicleManifest = {
  id: "vehicle",
  version: 1,
  label: "Vehicle",
  assetType: "VEHICLE",
  submitAdapter: "vehicle",
  steps: [
    { id: "type", title: "Vehicle type", fieldIds: ["vehicle_type"] },
    { id: "identity", title: "Make & model", fieldIds: ["make", "model", "year"] },
    { id: "specs", title: "Specifications", fieldIds: ["transmission", "fuel_type", "mileage", "condition", "exterior_color"] },
    { id: "location", title: "Location", fieldIds: ["state", "lga", "city", "area"] },
    { id: "pricing", title: "Price", fieldIds: ["price", "title", "description"] },
    { id: "photos", title: "Photos", fieldIds: ["photos"] },
    { id: "review", title: "Review", fieldIds: [] },
  ],
  fields: [
    {
      id: "make",
      label: "Make",
      input: "select",
      required: true,
      suggestion: { type: "catalog", id: "vehicle.makes" },
      dependsOn: { watch: ["vehicle_type"], optionsFrom: "vehicle.makes_for_type", clearIfInvalid: true },
      submitKey: "make",
      search: { filterKey: "make", facet: true, card: "subtitle", detail: "primary" },
    },
    {
      id: "model",
      label: "Model",
      input: "select",
      required: true,
      dependsOn: { watch: ["make"], optionsFrom: "vehicle.models_for_make", clearIfInvalid: true },
      submitKey: "model",
      search: { filterKey: "model", facet: true, card: "subtitle", detail: "primary" },
    },
    // … year, transmission (infer confirm chips), etc.
  ],
  photo: {
    min: 3,
    max: 20,
    tips: ["Front", "Rear", "Interior", "Dashboard", "Engine", "Tyres"],
    recommendedCover: "sharpest",
  },
  autofill: {
    titleRecipe: ["year", "make", "model", "transmission"],
    descriptionRecipe: "template_v1",
    priceSuggestion: "anomaly",
    photoChecklistFromTips: true,
  },
} as const satisfies CategoryManifest;
```

Seed from: `vehicle-specs.ts`, `vehicle-makes.ts`.

### Property (abbreviated)

```ts
export const propertyManifest = {
  id: "property",
  version: 1,
  label: "Property",
  assetType: "PROPERTY",
  submitAdapter: "property",
  steps: [
    { id: "deal", title: "Listing type", fieldIds: ["listing_type", "property_type"] },
    { id: "details", title: "Details", fieldIds: ["bedrooms", "bathrooms", "parking", "size_sqm", "title_document", "furnishing"] },
    { id: "location", title: "Location", fieldIds: ["state", "lga", "city", "area"] },
    { id: "pricing", title: "Price", fieldIds: ["price", "title", "description"] },
    { id: "photos", title: "Photos", fieldIds: ["photos"] },
    { id: "review", title: "Review", fieldIds: [] },
  ],
  fields: [
    {
      id: "bedrooms",
      label: "Bedrooms",
      input: "number",
      visible: { op: "rule", id: "property.show_room_fields" },
      validation: [{ type: "required" }, { type: "min", value: 0 }],
      submitKey: "bedrooms",
      search: { filterKey: "beds", facet: true, card: "meta", detail: "primary" },
    },
    {
      id: "title_document",
      label: "Title / survey",
      input: "select",
      visible: { op: "rule", id: "property.is_land" },
      // …
    },
  ],
  photo: {
    min: 3,
    max: 25,
    tips: ["Exterior", "Living room", "Kitchen", "Bedrooms", "Bathrooms", "Compound"],
  },
  autofill: {
    titleRecipe: ["property_type", "bedrooms", "city"],
    descriptionRecipe: "template_v1",
    priceSuggestion: "anomaly",
  },
} as const satisfies CategoryManifest;
```

Seed from: `listing-field-rules.ts`, `listingTypes.ts`, `propertyCategories.ts`, `listing-form-copy.ts`.

### Electronics (demonstration only — not launch scope)

```ts
export const electronicsManifest = {
  id: "electronics",
  version: 1,
  label: "Electronics",
  assetType: "ELECTRONICS", // future storage; adapter TBD
  submitAdapter: "electronics", // stub until vertical exists
  enabledInRegistry: false,
  steps: [
    { id: "type", title: "What is it?", fieldIds: ["device_type", "brand", "model_name"] },
    { id: "condition", title: "Condition", fieldIds: ["condition", "storage_gb", "color"] },
    { id: "pricing", title: "Price", fieldIds: ["price", "title"] },
    { id: "photos", title: "Photos", fieldIds: ["photos"] },
    { id: "review", title: "Review", fieldIds: [] },
  ],
  fields: [
    {
      id: "device_type",
      label: "Type",
      input: "select",
      required: true,
      suggestion: {
        type: "static",
        options: [
          { value: "phone", label: "Phone" },
          { value: "laptop", label: "Laptop" },
          { value: "tv", label: "TV" },
        ],
      },
    },
    {
      id: "brand",
      label: "Brand",
      input: "select",
      dependsOn: { watch: ["device_type"], optionsFrom: "electronics.brands_for_type", clearIfInvalid: true },
    },
  ],
  photo: { min: 2, max: 12, tips: ["Front", "Back", "Ports", "Box / accessories"] },
  autofill: { titleRecipe: ["brand", "model_name", "storage_gb"], descriptionRecipe: "off", priceSuggestion: "off" },
} as const;
```

**Point of the demo:** same shell, new TS file, no `ElectronicsForm.tsx`.

---

## Future extension strategy

Plug capabilities into metadata — do not fork the shell:

| Capability | Integration point |
|------------|-------------------|
| AI description | `descriptionRecipe: "llm_v2"` + suggestion source |
| VIN decode | infer id `vehicle.vin_decode` → patch fields |
| Property valuation | `priceSuggestion` source |
| Image recognition | photo tip fulfilment detector |
| Inspection reports | optional step in manifest `steps` |
| Vehicle history | advanced field group + external fetch |
| Mortgage / finance / insurance | post-publish or review add-ons via `capabilities[]` |

Each is a **new catalog / infer / recipe**, reviewed in git — not a new listing product.

---

## Migration strategy (away from hardcoded forms)

| Stage | Work | Risk |
|-------|------|------|
| **M0 — Docs** | This file + launch engine doc | None |
| **M1 — Types + resolver** | `listing-engine` package; unit tests for visibility/deps | None (unused) |
| **M2 — Vehicle pack** | Lift `vehicle-specs` / makes into manifest; shell behind flag on `/agent/listings/new/vehicle` | Medium |
| **M3 — Property pack** | Lift `listing-field-rules` + form fields; flag on `/agent/listings/new` | Medium |
| **M4 — Choose → Category step** | `/agent/listings/choose` becomes first engine step | Low |
| **M5 — Delete duplicates** | Remove `ListingForm` / `VehicleListingForm` trees after FAT parity | Only after green |
| **M6 — Future verticals** | Electronics etc. as packs when product opens them | Config-only |

**Do not** run M2–M5 during active launch FAT unless founder overrides freeze.

Parity checklist before deleting old forms:

- [ ] Create property + vehicle  
- [ ] Edit both  
- [ ] Drafts behaviour accepted  
- [ ] Photos + cover  
- [ ] Validation messages equivalent  
- [ ] Title autofill  
- [ ] Seller gates unchanged  

---

## Performance checklist

- [ ] Category index &lt; ~5KB  
- [ ] Catalogs code-split per category  
- [ ] Resolver pure + memoized  
- [ ] FieldRenderer memo per field id  
- [ ] No full-form remount on single keystroke  
- [ ] Shared location + photo modules not duplicated per vertical  

---

## Testing strategy

| Layer | Tests |
|-------|-------|
| Resolver | Visibility matrices (land vs apartment), dependency clears |
| Validation | Required-only-when-visible |
| Autofill | Title recipe snapshots |
| Adapters | Payload shape matches current create APIs |
| Shell | Step navigation + publish happy path (Playwright later) |

Config mistakes should fail **unit tests / tsc**, not first seller in production.

---

## Success criteria

1. **Single engine** for every listing category on Yike.  
2. **New category = TS config + catalogs + adapter**, not a new form codebase.  
3. Behaviour comes from **metadata**, not `if (vehicle)` trees.  
4. Typed configs stay in **git**, not live DB JSON (until a deliberate admin-config phase).  
5. Extensible for AI / VIN / valuation without redesign.  
6. Clean, scalable, testable for years of marketplace expansion.

---

## Related inventory (today)

| Piece | Path |
|-------|------|
| Vehicle field registry (seed) | `src/lib/marketplace/vehicle-specs.ts` |
| Make → model catalog | `src/lib/marketplace/vehicle-makes.ts` |
| Property visibility rules (seed) | `src/lib/listing-field-rules.ts` |
| Property form (migrate away) | `src/components/agent/listing-form.tsx` |
| Vehicle form (migrate away) | `src/components/marketplace/vehicle-listing-form.tsx` |
| Photos (keep) | `src/components/agent/listing-photo-manager.tsx` |
| Product contract | `docs/launch/INTELLIGENT_LISTING_ENGINE.md` |

---

## Final note

This is one of the highest-leverage architecture bets in the marketplace: **pay the abstraction cost once**, then expand categories for a decade without rebuilding sell-flow UX.

When freeze lifts, implement **M1 → M2 → M3** in that order. Resist the shortcut of “just one more hardcoded form.”
