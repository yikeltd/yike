# Performance Optimization Report — Responsive Homepage

**Date:** 2026-07-23  

---

## Choices that protect Nigeria mobile

| Topic | Decision |
|-------|----------|
| Hero payload | Desktop-only via CSS (`hidden lg:block`) — no JS viewport fork flash; mobile never paints hero layout |
| Hero image | Single WebP asset; `priority` only on desktop hero Image |
| Rails DOM | Single card tree (no duplicate mobile/desktop grids) |
| Card images | Browse variant; `priorityCount={2}` above fold |
| Ads | Zero height when inactive — no reserved empty slots |
| Sticky chrome | Mobile-only sticky toggle; desktop uses hero switch |

## Data fetch (unchanged)

Server still loads featured/recent/near pools once and derives rails in memory (`inventory-rails.ts`). Vehicles gated by launch flag.

## Avoided

- Client-only `useDesktopWeb` gate for hero (would flash inventory-first then swap)
- Dual-rendering every rail for “premium vs browse” card variants
- Extra search libraries or client-side listing fetches on home

## Follow-ups (optional, not blocking)

- Consider `loading="lazy"` for trust-strip icons already inline SVG (fine)
- If hero LCP regresses on desktop, add `fetchPriority="high"` only on hero Image (already `priority`)
