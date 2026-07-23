# Desktop Hero Enhancement Report

**Status:** Presentation ready — **hold commit**  
**Scope:** `HomeDesktopHero` + floating trust card (lg+ only)  
**Date:** 2026-07-23

## Changes

| Element | Before | After |
|--------|--------|-------|
| Eyebrow | Nigeria's Trusted Marketplace | Unchanged |
| Headline | Find. Rent. Buy. Drive. / All on Yike. | Find. Rent. Buy. Drive. / **Everything on Yike.** |
| Supporting | Category-dependent short lines | Unified: verified homes, vehicles, land & commercial · Browse free · Contact sellers directly |
| Primary actions | Mixed Find/Browse + List inline | **Grouped:** Properties\|Vehicles → Find Properties · Browse Vehicles → **List on Yike** (secondary) |
| Trust card | Agent avatar stack | Checklist trust card (see below) |
| Layout / image | City hero panel | Retained |

## Trust card

```
Trusted Across Nigeria
✓ Verified Listings
✓ Verified Sellers
✓ Secure Marketplace
2,000+ Buyers & Sellers
```

Elegant glass panel on navy — no avatars, minimal checklist + gold buyer count.

## Category switch

Properties | Vehicles gold pill retained. Active discovery CTA highlights gold; inactive stays ghost. Switching updates search panel below with fade-up.

## Intentionally unchanged

- Hero image, navy/gold identity, trust strip under panel
- Mobile inventory-first homepage
- Backend / auth / seller verification

## Validation

- [x] Desktop copy visible in SSR HTML (`Everything on`, `Find Properties`, `Trusted Across Nigeria`)
- [x] `npx tsc --noEmit` clean
- [ ] Founder visual review at `http://localhost:3000` (lg+)
