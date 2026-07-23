# Responsive Homepage Architecture Report

**Date:** 2026-07-23  
**Status:** Implemented locally · **Do not commit until founder review**  
**Preview:** `http://127.0.0.1:3000/`

---

## Verdict

Surgical presentation split only. Shared data, ads, location, search, and rails — **desktop vs mobile differ in chrome only**.

| Surface | Presentation |
|---------|--------------|
| **Desktop (`lg+`, ≥1024px)** | Premium hero (image + brand) → dual marketplace search → trust strip → shared inventory rails + smart ads |
| **Tablet (`md`–`lg`)** | Inventory-first hybrid (same as mobile chrome; no cramped hero) |
| **Mobile (`< lg`)** | Logo · Search · Location · sticky Properties\|Vehicles · inventory in first viewport — **no hero** |

## Architecture

```
page.tsx (server data: rails, ads, location)
  └── HomeMarketplaceExperience (client)
        ├── HomeDesktopHero          [hidden lg:block]
        │     ├── Properties | Vehicles toggle
        │     ├── BrowseListingsBlock  → /search
        │     └── HomeDesktopVehicleSearch → /vehicles
        ├── Sticky category toggle   [lg:hidden]
        └── Shared rails + HomeAdSlot × 5 + Popular Cities + trust
```

## Unchanged (by design)

- Auth, seller verification, search engine internals
- Listing APIs, admin, location engine core, marketplace logic
- Database schema (no new migrations)

## Primary files

| File | Role |
|------|------|
| `home-marketplace-experience.tsx` | Responsive shell + shared rails |
| `home-desktop-hero.tsx` | Premium dual-marketplace desktop hero |
| `home-desktop-vehicle-search.tsx` | Desktop vehicle filters (State/City/Make/Budget) |
| `header-desktop.tsx` | Marketplace nav: Buy · Rent · Vehicles · Land · Sell · Safety |
| `page.tsx` | Data wiring + trusted agents config |
| `browse-grid.ts` | `HOME_RAIL_GRID_CLASS` (mobile compact / desktop larger) |

## Validation

- `npx tsc --noEmit` — pass
- Localhost `200` — hero markers + sticky category + Popular Cities present in HTML
- CSS gate: hero `hidden lg:block`; mobile sticky `lg:hidden`
