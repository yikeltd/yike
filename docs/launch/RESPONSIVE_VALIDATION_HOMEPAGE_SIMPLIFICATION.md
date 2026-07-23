# Responsive Validation Report — Homepage Simplification

**Date:** 2026-07-23  
**Status:** Ready for founder review — **no commit**

## Architecture (unchanged)

| Viewport | Experience |
|----------|------------|
| `lg+` | Premium hero + shared inventory rails |
| `< lg` | No desktop hero; sticky Properties \| Vehicles toggle; shared rails |

Single `HomeMarketplaceExperience` DOM for rails — no duplicate mobile/desktop inventory trees.

## Desktop (`lg+`)

- [x] Header: Logo · marketplace nav · Sign in · SELL (no location chip)
- [x] Hero premium panel + floating search
- [x] No 4-up marketing trust grid
- [x] Rail order: Featured Near You → ads → Recent → Luxury → Recommended → Popular Cities
- [x] Compact trust badges only
- [x] Demo banner absent when `NODE_ENV !== "development"`

## Mobile / tablet (`< lg`)

- [x] Inventory-first (no marketing blocks reintroduced)
- [x] Location remains in mobile header (search chrome needs it)
- [x] Same empty-state + demo-hide rules as desktop
- [x] Same rail order and ad slots
- [x] Category sticky toggle retained

## Cross-checks

| Check | Result |
|-------|--------|
| Property ↔ vehicle toggle | Shared rails swap datasets |
| Ad slots 1–4 | Render only when creative present |
| Footer | Follows rails; download strip removed from home |
| Hero Search → `/search` / `/vehicles` | Unchanged |

## Manual preview checklist

1. `http://localhost:3000/` at ≥1280px — header SELL, short hero line, inventory order  
2. Resize &lt;1024px — no hero, inventory + mobile location  
3. Empty city cookie — rails fill nearby silently (or short empty if none)  
4. Production build — no `[DEMO]` banner / fixtures  

## Commit

**None** — hold until founder review.
