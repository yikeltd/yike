# Universal Listing Flow Engine — Enterprise Architecture Guide

## Overview

The **Universal Listing Flow Engine** is Yike's configuration-driven onboarding and listing creation platform. It powers all listing categories (Vehicles, Real Estate, Heavy Machinery, Commercial Space, Services, etc.) through a single adaptive UI engine without category-specific code or UI rewrites.

---

## System Architecture

```
                                ┌───────────────────────────────┐
                                │   Category Configuration      │
                                │   (vehicles.ts, props.ts)     │
                                └──────────────┬────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Universal Listing Wizard Engine                       │
│                                                                             │
│   ┌────────────────────┐   ┌────────────────────┐   ┌───────────────────┐   │
│   │   Flow State       │   │  Smart Dependency  │   │  Progress Engine  │   │
│   │   Machine          │   │  Evaluator         │   │  Calculator       │   │
│   └─────────┬──────────┘   └─────────┬──────────┘   └─────────┬─────────┘   │
│             │                        │                        │             │
│             ▼                        ▼                        ▼             │
│   ┌────────────────────┐   ┌────────────────────┐   ┌───────────────────┐   │
│   │  Composite         │   │  Draft Storage     │   │  Analytics        │   │
│   │  Validation        │   │  Adapter           │   │  Adapters         │   │
│   └────────────────────┘   └────────────────────┘   └───────────────────┘   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
                        ┌──────────────────────────────┐
                        │   Onboarding UI Presentation │
                        │   (Layout, Cards, Images)    │
                        └──────────────────────────────┘
```

---

## Directory Structure

```
src/
  lib/listing-engine/
    analytics/
      analytics-adapter.ts     # Abstract analytics providers (Console, GA, PostHog)
      tracker.ts               # Telemetry tracking interface
    configs/
      index.ts                 # Category registry loader
      properties.ts            # Property listing configuration schema
      vehicles.ts              # Vehicle listing configuration schema
    drafts/
      storage-adapter.ts       # Abstract draft storage interface (LocalStorage, Supabase, Memory)
      store.ts                 # Real-time draft persistence engine
    plugins/
      registry.ts              # Plugin registration API (listing types, validators, processors)
    progress/
      calculator.ts            # Dynamic completion & time estimate calculator
    questions/
      evaluator.ts             # Smart dependency evaluator (conditional visibility)
    validation/
      composite-validator.ts   # Composite client/async/custom validator
      validator.ts             # Standard field validation rules
    types.ts                   # Engine configuration types & state machine definitions
  components/
    listing-engine/
      media-engine.tsx         # Drag & drop photo/document uploader
      question-renderer.tsx    # Dynamic field input renderer
      universal-listing-wizard.tsx # Main Listing Engine component
```

---

## Step-by-Step Extension Guide

### 1. How to Add a New Marketplace Category

To register a new listing category (e.g. `heavy_equipment`):

1. Create a configuration file in `src/lib/listing-engine/configs/heavy-equipment.ts`:

```typescript
import type { ListingCategoryConfig } from "../types";

export const HEAVY_EQUIPMENT_CONFIG: ListingCategoryConfig = {
  id: "heavy_equipment",
  label: "Heavy Equipment & Machinery",
  description: "List bulldozers, excavators, and cranes for sale or hire.",
  assetCategory: "cars",
  defaultAsset: "equipment",
  steps: [
    {
      id: "category",
      title: "Select Equipment Category",
      fields: [
        {
          id: "equipment_type",
          label: "Category",
          type: "card_select",
          stepId: "category",
          options: [
            { id: "excavator", label: "Excavator", assetCategory: "cars", assetName: "equipment" },
            { id: "crane", label: "Mobile Crane", assetCategory: "cars", assetName: "truck" },
          ],
        },
      ],
    },
  ],
};
```

2. Register the category in `src/lib/listing-engine/configs/index.ts`:

```typescript
import { registerCategoryConfig } from "./index";
import { HEAVY_EQUIPMENT_CONFIG } from "./heavy-equipment";

registerCategoryConfig(HEAVY_EQUIPMENT_CONFIG);
```

3. Create the route `src/app/agent/listings/heavy-equipment/page.tsx`:

```tsx
import { UniversalListingWizard } from "@/components/listing-engine/universal-listing-wizard";

export default function HeavyEquipmentPage() {
  return <UniversalListingWizard categoryId="heavy_equipment" />;
}
```

---

### 2. How to Register Custom Validators

```typescript
import { listingEnginePlugins } from "@/lib/listing-engine/plugins/registry";

listingEnginePlugins.registerValidator("price", (value, formData) => {
  if (Number(value) > 1000000000) {
    return "Price exceeds maximum allowable threshold.";
  }
  return null;
});
```

---

### 3. How to Plug in a Custom Analytics Provider

```typescript
import { registerAnalyticsProvider } from "@/lib/listing-engine/analytics/analytics-adapter";

class PostHogAnalyticsProvider {
  name = "PostHog";
  trackEvent(eventName: string, payload: Record<string, unknown>) {
    // window.posthog.capture(eventName, payload);
  }
}

registerAnalyticsProvider(new PostHogAnalyticsProvider());
```

---

### 4. How to Plug in a Cloud Draft Storage Provider

```typescript
import { setDraftStorageAdapter } from "@/lib/listing-engine/drafts/storage-adapter";

class SupabaseDraftAdapter {
  name = "Supabase";
  async saveDraft(categoryId, currentState, stepIndex, formData) {
    // Sync draft to Supabase database table
  }
  async loadDraft(categoryId) { /* ... */ }
  async clearDraft(categoryId) { /* ... */ }
}

setDraftStorageAdapter(new SupabaseDraftAdapter());
```

---

## Verification & Integrity

- **Category-Agnostic Core**: No hardcoded category conditional logic in the wizard engine.
- **Smart Dependencies**: Supports `equals`, `not_equals`, `contains`, `in`, `truthy`, and `falsy`.
- **Zero Cumulative Layout Shift**: All WebP onboarding assets render with intrinsic dimensions.
