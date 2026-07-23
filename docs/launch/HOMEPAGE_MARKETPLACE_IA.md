# Homepage — Inventory First Marketplace v1

**Date:** 2026-07-23  
**Status:** Implemented locally · **Do not commit until founder review**  
**Direction:** Netflix / Airbnb browse-first · refine on Search · **not** Concept B filter-panel home  
**Preview:** `http://127.0.0.1:3000/` · `http://127.0.0.1:3000/?category=vehicle`

---

## Philosophy

Homepage = inventory discovery. Search page = filters & refine.  
~15% chrome / ~85% listings. Listing visible in first viewport (&lt;3s).

## Structure (strict)

```
[ Logo | 🔍 Search anything… | + List ]     ← header only (one search)

[ Properties | Vehicles ]                   ← sticky Uber-style gold pill

Featured                                    ← inventory immediately
Recently Added
Near You          (properties)  |  Low Mileage (vehicles)
Luxury Collection

Trending / Explore Locations                ← below fold, optional
Trust badges · Download App · Footer
```

## Never on homepage

- Permanent State / City / Type / Budget filter row
- Mid-page duplicate search bar
- Welcome / marketing hero
- Saved / Profile in header (bottom nav only)
- Swipe in bottom nav

## Bottom nav

`Home · Search · Saved · Sell · Account`

- Sell → list flow (`/post-property`)
- Search → `/search` (filters live here)

## Browse cards only

```
PHOTO (dominant, ~4:5)
₦48M
4 Bed Duplex
📍 Umuahia
Verified
```

No seller, amenities, Feat clutter, WhatsApp, dates on home cards. Subtle save on image OK.

## Rails data

| Rail | Source |
|------|--------|
| Featured | Boosted / featured flags |
| Recently Added | `created_at` desc |
| Near You | Pref city cookie if set; else popular cities (honest label) |
| Low Mileage | Vehicles sorted by mileage (≤80k preferred) |
| Luxury Collection | High price / luxury type (props ≥₦50M sale; vehicles ≥₦25M) |

Demo UI fixtures still fill empty local inventory.

## Primary files

- `src/components/home/home-marketplace-experience.tsx`
- `src/lib/home/inventory-rails.ts`
- `src/app/(public)/page.tsx`
- `src/components/property/property-card.tsx` (`variant="browse"`)
- `src/components/marketplace/vehicle-card.tsx` (`variant="browse"`)
- `src/components/layout/primary-bottom-nav.tsx`
- `src/components/home/marketplace-category-toggle.tsx`

## How to preview

```bash
npm run dev
# http://localhost:3000/
# http://localhost:3000/?category=vehicle
# /search — confirm filters present
# Mobile: DevTools ~390px — Featured in first viewport
```

**Commit:** hold — founder review required.
