# Homepage UX Report — Final Refinement

**Status:** Ready for founder review · **No commit**

## Summary

Inventory-first homepage chrome tightened: header is Logo → Search (max width) → Location; browse cards denser (`4/3` thumb); five smart ad slots collapse when empty.

## Header

| Before | After |
|--------|--------|
| Logo · Location · Search · **List** | Logo · **Search (flex-1)** · Location ▼ |
| Sell duplicated in header + bottom nav | Sell **bottom nav only** |

- Desktop home + mobile: List CTA removed.
- Location chip on the **right** opens existing `MarketplaceLocationPicker` (Nationwide / State / City).
- Persistence unchanged: localStorage + cookie hydrate via `ensureMarketplaceLocationPersisted()`.
- Non-home desktop keeps account nav; List removed there too.

## Listing density

- `BROWSE_THUMB_ASPECT`: `4/5` → **`4/3`** (fixed ratio, shorter cards).
- Browse card copy compacted (1-line title, smaller type, tighter padding).
- Property + vehicle browse cards aligned.
- Target: **~3–4 cards** in first mobile viewport (2-col grid preserved).

## Rails + ads (order)

```
Featured → Ad 1 → Recently Added → Ad 2 → Near You → Ad 3
→ Luxury → Ad 4 → Recommended → Ad 5 → Across Nigeria (if Trending filled Recommended)
```

- Recommended = Trending when present; else Nationwide titled “Recommended for you”.
- Ad components return `null` when no live campaign — **no empty gaps**.

## Files (UX)

- `src/components/layout/header-desktop.tsx`
- `src/components/layout/header-mobile.tsx`
- `src/components/location/marketplace-location-indicator.tsx`
- `src/lib/marketplace/browse-grid.ts`
- `src/components/property/property-card.tsx`
- `src/components/marketplace/vehicle-card.tsx`
- `src/components/home/home-marketplace-experience.tsx`
- `src/app/(public)/page.tsx`
- `src/components/ui/skeleton.tsx`

## Validate

- Local `/` — header shape + denser cards
- `npx tsc --noEmit` — pass
