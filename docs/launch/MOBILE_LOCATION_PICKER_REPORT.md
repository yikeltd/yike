# Mobile Location Picker Report

**Status:** Presentation ready — **hold commit**  
**Critical fix:** Sheet was rendering under page content  
**Date:** 2026-07-23

## Root cause

`MarketplaceLocationPicker` used `position: fixed` **inside** the sticky mobile header (`backdrop-blur-md`). `backdrop-filter` creates a containing block, so the overlay was trapped in the header stacking context and appeared clipped / under listings.

## Fix

| Requirement | Implementation |
|-------------|----------------|
| Highest z-index | `z-[200]` (above header `z-40`, bottom nav `z-50`) |
| Never clips under cards | `createPortal(…, document.body)` |
| Dim backdrop | Navy/45 overlay; tap outside dismisses |
| Rounded sheet | `rounded-t-[1.35rem]` + grab handle |
| Smooth open/close | Opacity + `translate-y` 300ms ease |
| Independent scroll | `overflow-y-auto` + `overscroll-contain` + max-height |
| Body lock | `document.body.style.overflow = hidden` while open |
| Escape | Keyboard Escape closes |

## Scopes (unchanged logic)

- Near Me (geolocation)
- Nationwide
- State → Entire state / City

Selection still persists via marketplace location helpers and calls `router.refresh()` from the indicator — inventory refreshes immediately.

## Unchanged

- Chip UI in header
- Preference / cookie / centroid logic
- First-visit location prompt component

## Validation

- [x] Portal + body mount
- [x] Typecheck clean
- [ ] Mobile: open sheet over inventory rails + bottom nav
- [ ] Select city → rails refresh
