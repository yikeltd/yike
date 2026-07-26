# Header Redesign Report

**Date:** 2026-07-26  
**Type:** Surgical UI refactor — Google-inspired search-first marketplace header  
**Authority:** Founder-approved

## Summary

Marketplace chrome reduced to **Logo · Search · Menu**. Location and microphone live **inside** the search surface. No backend, routing, search API, YIP, or auth changes.

## Files modified

| File | Change |
|------|--------|
| `src/components/layout/header-desktop.tsx` | Logo \| Search \| Menu only |
| `src/components/layout/header-mobile.tsx` | Same three-element row; location chip removed from outside search |
| `src/components/search/header-universal-search.tsx` | Presentation: embed location + disabled mic; placeholder + soft shadow |
| `src/components/location/marketplace-location-indicator.tsx` | Added `variant="embedded"` for in-bar styling |
| `src/components/marketplace/experience/marketplace-nav-sheet.tsx` | Sheet links include Buy/Rent/Land + account row (open/close unchanged) |

## Components reused

- `HeaderUniversalSearch` (existing search commit / suggestions / routing)
- `MarketplaceLocationIndicator` → `MarketplaceLocationPicker`
- `MarketplaceNavSheet`
- `AuthHeaderAccount` (moved into menu sheet for desktop parity)
- Brand logo tokens

## Components removed / demoted from header chrome

- Desktop primary nav link row (Buy / Rent / …) — now reachable via ☰
- Desktop Sell CTA button — Sell remains in menu sheet + bottom nav
- Standalone location chip beside search on mobile

## Not changed

- Search algorithms / `smart-search` / APIs  
- Filters, listing logic, auth sessions  
- Database, Supabase, feature flags, YIP / plugins / Lex  

## Voice

Microphone is a **disabled** affordance (`Voice search coming soon`). No speech recognition added.

## Verification

- [x] `npx tsc --noEmit`
- [ ] `npm run lint` (run in CI / local)
- [ ] `npm run build`
- Manual: desktop / tablet / mobile — logo, search focus, location picker, menu sheet

## Confirmation

**No backend or business-logic modules were modified.** This is presentation and header composition only.
