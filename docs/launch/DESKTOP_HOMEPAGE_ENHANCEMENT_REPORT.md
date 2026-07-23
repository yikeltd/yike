# Desktop Homepage Enhancement Report

**Date:** 2026-07-23  
**Status:** Implemented · hold commit  
**Breakpoint:** `lg+` (≥1024px)

---

## What shipped

### Premium hero (preserved + upgraded)

- Existing city hero image + navy/gold gradients retained
- Headline: **Find. Rent. Buy. Drive. / All on Yike.**
- Supporting copy switches with Properties vs Vehicles
- Trusted agents card retained
- Trust strip retained below hero (Verified, Smart search, Support, WhatsApp)

### Dual marketplace in hero

| Mode | Search fields | CTA / routing |
|------|---------------|---------------|
| Properties | Deal chips + State · City · Type · Budget | → `/search` via existing `BrowseListingsBlock` |
| Vehicles | State · City · Make · Budget | → `/vehicles` via `HomeDesktopVehicleSearch` |

Properties \| Vehicles gold pill (`tone="onDark"`) syncs URL `?category=` and inventory rails below.

### After hero

Featured → Ad → Recently Added → Ad → Near You / Low Mileage → Ad → Luxury → Ad → Recommended → Ad → Popular Cities → Trust → Footer  

Ads render only when active (`HomeAdSlot`).

### Desktop nav

Simplified from Explore / Shortlet / Swipe clutter to:

**Buy · Rent · Vehicles · Land · Sell · Safety** (+ location chip + account)

Hero owns primary search on desktop home — header no longer duplicates a large search field.

### Cards

Homepage rails use `HOME_RAIL_GRID_CLASS`: 4–5 columns on `lg+` (larger cards) vs dense 6–8 browse elsewhere.
