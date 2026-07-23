# Responsive UI Validation — Hero & Location

**Status:** Hold commit pending founder review  
**Date:** 2026-07-23

## Breakpoint gates

| Viewport | Expectation | Result |
|----------|-------------|--------|
| `< lg` | Inventory-first homepage; no desktop hero | Unchanged structure |
| `< lg` | Location chip → full-viewport bottom sheet | Fixed via portal |
| `lg+` | Desktop hero + search panel + trust card | Copy/CTA/trust refined |
| `lg+` | Properties \| Vehicles switch | Panel + discovery CTAs sync |

## Checks performed

- [x] Homepage HTTP 200
- [x] SSR contains desktop hero strings (gated `hidden lg:block` still in HTML)
- [x] `tsc --noEmit` exit 0
- [ ] Visual: iPhone-width location sheet over listings
- [ ] Visual: desktop 1280px messaging + trust card

## Non-regression

- Mobile category sticky rail untouched
- Shared inventory rails untouched
- No API / auth / seller verification edits
