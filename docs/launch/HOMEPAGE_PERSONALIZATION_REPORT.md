# Homepage Personalization Report

**Date:** 2026-07-23  
**Status:** Implemented locally · **Do not commit until founder review**  
**Architecture preserved:** Inventory First — browse-first, no permanent filter form on home.

---

## Localized rail titles

| Rail | With city | Fallback / expanded |
|------|-----------|---------------------|
| Featured | Featured in {City} / Featured Near You | Featured · Across Nigeria |
| Recently Added | Recently Added in {City} | Recently Added Near You + honest subtitle |
| Trending | Trending in Your City | Popular in {State} |
| Nearby Deals | Nearby Deals | Scope subtitle when expanded |
| Low Mileage (vehicles) | Low Mileage + location scope subtitle | Sorted by lowest km |
| Luxury Collection | Luxury Collection | Optional scope subtitle |
| Across Nigeria | Always lower on page | Featured nationwide |

Property and Vehicles modes both use the same location ranking helpers.

---

## Instant refresh

Changing location in the picker:

1. Writes localStorage + cookies  
2. Calls `router.refresh()`  
3. Server reloads rails with new preferred city/state  

Demo banner appends `· location: {City}` when fixtures are active and a preference exists.

---

## Demo fixtures

- Still activate only when live inventory is empty (non-production)
- `filterDemoByLocation()` prefers same-city DEMO rows (Aba / Yola fixtures added)
- Clear **[DEMO]** labels retained

---

## What was not added

- No mid-page State/City/Type/Budget filter row  
- No Passport / NIN  
- No permanent homepage search form (header search only)

## Preview

`http://127.0.0.1:3000/` · set 📍 Aba or Yola via picker  
`?category=vehicle` for vehicle rails
