# Search Intelligence Report

**Date:** 2026-07-23  
**Status:** Implemented locally · **Do not commit until founder review**  
**Approach:** Pragmatic pattern matching on existing `smart-search` + `location-search` — not a full NLP stack.

---

## Extended parser (`src/lib/smart-search.ts`)

| Signal | Examples | Output |
|--------|----------|--------|
| Vehicle make/model | Toyota Camry | `vertical=vehicle`, `make`, `model` → `/vehicles` |
| Body type | SUV, sedan, pickup, keke | `body_type` |
| Beds + type | 2 Bedroom Apartment | `bedrooms=2`, `property_type=flat` |
| Land + city | Land in Enugu | `property_type=land`, `city=Enugu`, `switchesLocation` |
| Budget | SUV under ₦20m | `max_price=20000000` |
| Area + city | House in GRA Port Harcourt | `bungalow` + `area=GRA`, `city=Port Harcourt`, `state=Rivers` |

Also handles: `under 20m`, `₦20m`, cheap/affordable caps, strip of leading `in` / trailing `state`.

---

## Location context switch

When a query (or suggestion) resolves an explicit Nigerian city/state:

1. `setMarketplaceLocation({ source: "search" })`
2. Cookies + browse prefs update
3. Search navigates to `/search` or `/vehicles` with structured params
4. Homepage rails refresh on next visit / `router.refresh`

Nationwide search remains always allowed — location only enhances ranking context.

---

## Universal search UX

- Header bar still “Search anything…”
- Suggestions reuse location index + parsed label
- Vehicle makes route to vehicle vertical when detected

---

## Validation samples

```
Toyota Camry              → Toyota · Camry (vehicle)
2 Bedroom Apartment       → 2 bed · Flat
Land in Enugu             → Land · Enugu, Enugu (switchesLocation)
SUV under ₦20m            → SUV · under ₦20m (max 20_000_000)
House in GRA Port Harcourt → Bungalow · GRA, Port Harcourt
```

## Limits (intentional)

- No ML / embeddings
- City match depends on `nigeriaLocations` + location index quality
- Ambiguous short queries may stay as free-text `q`
