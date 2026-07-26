# Mobile Header Refinement — Category Chips + Auto-Hide

**Date:** 2026-07-26  
**Type:** Surgical frontend UI — founder-approved  
**Scope:** Homepage mobile header only (desktop unchanged)

## Summary

Mobile header is now **search-first**:

1. Logo + search (location + mic inside search)  
2. Compact **Vehicles / Properties** category chips under search  
3. Chips **auto-hide** on scroll down; return at the top  
4. Hamburger menu **removed** on mobile (bottom nav covers Sell / Account / Browse)

Desktop header retains Logo · Search · Menu.

## Files changed

| File | Change |
|------|--------|
| `src/components/layout/header-mobile.tsx` | Remove menu; add chips + scroll collapse |
| `src/components/home/marketplace-category-chips.tsx` | New visual category chips |
| `src/lib/home/category-chip-assets.ts` | Chip image asset map |
| `public/images/categories/vehicle-chip.svg` | Premium vehicle gateway art |
| `public/images/categories/property-chip.svg` | Premium property gateway art |
| `src/components/home/home-marketplace-experience.tsx` | Remove duplicate sticky text tabs |

## Interaction

- On `/`: chips update `?category=` (same home rails switch as before)  
- Off home: chips fall back to `/vehicles` and `/search`  
- Active chip: gold ring + soft gold surface  
- Vehicles chip respects `vehicle_marketplace` launch flag  

## Animation approach

Chips sit in a sticky header sibling under the search row.

| Property | Visible | Hidden |
|----------|---------|--------|
| `max-height` | `88px` | `0` |
| `opacity` | `1` | `0` |
| `transform` | `translateY(0)` | `translateY(-8px)` |
| Duration | **200ms** ease-out | |

Scroll listener (rAF-throttled, passive):

- `scrollY ≤ 16` → show chips  
- `scrollY > 40` → hide chips  

Search + logo stay sticky; collapsing `max-height` avoids abrupt layout jumps.

## Performance impact

- No new libraries  
- Two tiny local SVGs (`unoptimized` next/image)  
- One passive scroll listener only while `pathname === "/"`  
- Chip row removed from page body (was a second sticky toggle) — less sticky stacking  

## Screenshots

### Top of page (chips visible)

![Top](./screenshots/mobile-header-top.png)

### While scrolling (chips hidden, search sticky)

![Scrolled](./screenshots/mobile-header-scrolled.png)

### Returned to top (chips restored)

![Returned](./screenshots/mobile-header-returned.png)

## Not changed

Search API · marketplace logic · filters · auth · backend · DB · YIP · plugins · Launch Command Center · desktop header

## Verification

- [x] `npm run lint` on touched files (0 errors; pre-existing warning in home experience)  
- [x] `npm run typecheck`  
- [x] `npm run build`
