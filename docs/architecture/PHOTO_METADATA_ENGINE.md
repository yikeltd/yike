# Photo Metadata Engine — Category-Aware Photo Schemas

**Status:** Architecture correction (founder-approved) · 2026-07-26  
**Authority:** Listing Metadata Engine — [METADATA_LISTING_ENGINE.md](./METADATA_LISTING_ENGINE.md)  
**Code:** `src/lib/listing-engine/photo-schema/`

---

## Problem this solves

Photo classification must not share one global tag list across marketplace categories.

| Wrong | Right |
|-------|--------|
| Vehicle dropdown shows Bedroom / Kitchen | Vehicle owns vehicle taxonomy |
| Property dropdown shows Engine / Tyres | Property / land own their taxonomies |
| UI hardcodes category lists | UI renders `metadata.photo.schema` only |

---

## Architecture

```
CategoryManifest
      │
      └─ photo: PhotoRules
              ├─ schema              ← default taxonomy
              ├─ schemaVariants[]    ← land / commercial / shortlet / …
              ├─ min / max
              └─ tips? (optional; defaults to schema.recommendedShots)

Listing values (property_type, listing_type, …)
      │
      ▼
resolvePhotoSchema(photo, values)
      │
      ▼
PhotoSchema → tags · uploadSequence · cover prefs · recommendedShots
      │
      ▼
ListingPhotoManager (generic) — renders schemaLabels(schema)
```

**No UI rewrites when adding motorcycles, boats, hospitality, etc.** — add a schema (+ optional variant rule) in metadata.

---

## PhotoSchema shape

```ts
type PhotoTag = { id: string; label: string };

type PhotoSchema = {
  id: string;                 // e.g. "vehicle" | "property.land"
  version: number;
  tags: PhotoTag[];           // dropdown options (label stored in room_label)
  uploadSequence: string[];   // tag ids for sequential suggest
  preferredCoverIds: string[];
  poorCoverIds: string[];
  storyOrder: Record<string, number>;
  recommendedShots: string[]; // soft “Recommended shots” chips
  uploadHint?: string;
  labelPlaceholder?: string;
};
```

Only truly generic tags (e.g. **Cover Photo**, **Other**) should appear across schemas. Domain tags stay domain-owned.

---

## Shipped taxonomies

| Schema id | Use |
|-----------|-----|
| `vehicle` | Cars / SUVs / trucks (extendable per `auto_category` later) |
| `property.residential` | Default houses / flats |
| `property.shortlet` | Short-let stays |
| `property.land` | Land / plots |
| `property.commercial` | Shop / office / plaza |
| `dealer.showroom` | Dealer profile media (exported, ready for wiring) |

Property variants resolve via named visibility rules:

1. `property.is_land` → land  
2. `property.is_commercial` → commercial  
3. `listing_type === shortlet` → shortlet  
4. else → residential  

---

## Validation

- UI: selecting a label not in the active schema is ignored.  
- On schema change: `migratePhotoLabel` remaps or falls back to **Other** — photos are never dropped.  
- Property create API sanitizes `media_items[].room_label` against the resolved property schema.  

---

## Migration strategy

1. Existing `room_label` strings keep working when they match the new taxonomy.  
2. Legacy aliases (`Exterior`, `Parlor`, `Land View`, …) map to the closest modern label for the active schema.  
3. Cross-category leftovers (`Bedroom` on a vehicle) → **Other**.  

---

## Extension process

1. Define `buildPhotoSchema({ id, tags, uploadSequence, … })` under `photo-schema/`.  
2. Attach as `photo.schema` or a `schemaVariants` entry on the category manifest.  
3. Pass `resolvePhotoSchemaFromManifest(manifest, values)` into `ListingPhotoManager`.  
4. Add unit coverage in `photo-schema/__tests__/`.  

Do **not** add `if (category === …)` branches in the photo manager.

---

## Cover photo

Cover remains the `is_cover` flag + reorder behaviour (unchanged).  
Schemas may include a **Cover Photo** classification tag in addition to the cover star — taxonomy and cover are complementary.

---

## Related

- Manifests: `categories/vehicle.ts`, `categories/property.ts`  
- Rules SSOT: `photo-schema/rules.ts` (`PROPERTY_PHOTO_RULES`, `VEHICLE_PHOTO_RULES`)  
- Compatibility shim: `src/lib/media/labels.ts` (deprecated — prefer schema helpers)
