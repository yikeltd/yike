# Homepage Simplification Report

**Date:** 2026-07-23  
**Status:** Ready for founder review — **no commit**  
**Scope:** Final pre-launch homepage simplification (desktop + mobile shared rails)

## Verdict

Homepage is inventory-first: premium hero (desktop), short copy, no marketing grids, compact trust only, demo UI gated to development.

## Changes

### Removed
- Desktop header location selector (“Nigeria” / city chip)
- Marketing trust grid under hero (Verified & Trusted · Smart Search · Expert Support · WhatsApp-first)
- Hero “List on Yike” secondary CTA (Sell is header CTA)
- Floating trust card buyer-count fluff
- Nearby Deals / Low Mileage middle rails (inventory still available via Featured / Recent / Recommended)
- Duplicate “Across Nigeria” rail after Recommended
- Home trending-searches block
- Home download-app strip (Popular Cities → footer)
- Long empty-state / “Showing across Nigeria” expansion notices
- Rail section subtitles on homepage

### Retained / tightened
- Premium desktop hero + floating search (property / vehicle)
- Compact floating trust checklist (Verified Listings · Sellers · Secure Marketplace)
- Compact footer-of-rails trust badges: ✓ Verified Listings · ✓ Verified Sellers · ✓ Secure Marketplace
- Smart ad slots between inventory rails (slots 1–4)
- Popular Cities row
- Mobile inventory-first (category toggle + shared rails; location stays in mobile header)

### Desktop order after hero
1. Featured Near You  
2. Ad  
3. Recently Added  
4. Ad  
5. Luxury  
6. Ad  
7. Recommended  
8. Ad  
9. Popular Cities  
10. Compact trust badges → site footer  

## Demo / production

| Gate | Behavior |
|------|----------|
| `NODE_ENV === "production"` / `isProductionEnv()` | No demo fixtures, no `[DEMO]` banners |
| `NODE_ENV !== "development"` | Fixtures off (preview/prod builds) |
| `YIKE_DISABLE_DEMO_UI=1` | Fixtures off even in local dev |

Documented in `.env.example`.

## Files touched (primary)

- `src/components/layout/header-desktop.tsx`
- `src/components/home/home-desktop-hero.tsx`
- `src/components/home/home-marketplace-experience.tsx`
- `src/components/home/home-trust-badges.tsx`
- `src/components/home/home-desktop-trusted-agents-card.tsx`
- `src/components/marketplace/marketplace-empty-state.tsx`
- `src/lib/demo-ui-fixtures.ts`
- `src/lib/marketplace-location/rank.ts` / `rail-labels.ts`
- `src/app/(public)/page.tsx`
- `src/app/(public)/vehicles/page.tsx`

## Not changed

- Auth / seller APIs  
- Architecture / data fetching model  
- Mobile header location (intentional — search lives in header on mobile)  

## Commit

**None** — hold until founder review.
