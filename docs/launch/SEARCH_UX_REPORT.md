# Search UX Report

**Status:** Presentation ready — **hold commit**  
**Scope:** Desktop hero search panel (property + vehicle)  
**Date:** 2026-07-23

## Panel behaviour

| Mode | Fields | CTA |
|------|--------|-----|
| Properties | State · City · Property Type · Budget | **Search Properties** |
| Vehicles | State · City · Vehicle Make · Budget | **Search Vehicles** |

Switching category remounts the panel with `animate-fade-up` for a seamless transition. Placeholders refined for clarity (State / City / Property Type|Vehicle Make / Budget). Spacing: slightly taller CTA (`h-11`), tighter premium gaps on xl.

## Discovery CTAs ↔ panel

- **Find Properties** → ensures property category + scrolls to `#home-desktop-search`
- **Browse Vehicles** → ensures vehicle category + scrolls to panel
- Search still routes through existing `/search` and `/vehicles` handlers (no new search engine)

## Unchanged

- Filter option sources (`ThemedSelect`, budget ranges, vehicle makes)
- Deal-type chips on property panel
- Mobile search / header universal search

## Validation

- [x] Property CTA label = Search Properties
- [x] Vehicle CTA label = Search Vehicles
- [x] Typecheck clean
- [ ] Manual lg+ toggle: placeholders + CTA update without layout jump
