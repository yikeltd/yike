# Search Integration Report — Responsive Homepage

**Date:** 2026-07-23  

---

## Principle

**One search system.** Desktop hero is a presentation shell over existing browse → `/search` and vehicle → `/vehicles` flows. No duplicate engines.

## Desktop hero

| Category | Component | Params | Destination |
|----------|-----------|--------|-------------|
| Properties | `BrowseListingsBlock` (`home-desktop-panel`) | type/hub, state, city, property_type, min/max | `/search?…` |
| Vehicles | `HomeDesktopVehicleSearch` | state, city, make, min_price/max_price | `/vehicles?…` |

Both call shared helpers: budget ranges, state/city options, vehicle makes, analytics `trackEvent`, `addRecentSearch`.

## Mobile

- Header universal search (`HeaderUniversalSearch`) unchanged
- Sticky Properties \| Vehicles syncs `?category=` for rails only
- Refine filters remain on Search / Vehicles pages

## Category sync

`syncCategory` in `HomeMarketplaceExperience`:

- Updates local state + URL `category=property|vehicle`
- Clears property-only params when switching to vehicles
- Hero toggle and mobile sticky share the same callback → rails update together

## Not changed

- `smart-search.ts`, search API routes, ranking, location preference cookies
- Header search internals
