# Marketplace Discovery & Engagement (P1 — Pre-Launch UX Polish)

**Status:** Shipped (presentation layer)  
**Feature freeze:** ACTIVE — respected  
**Date:** 2026-07-26  
**Depends on:** [MARKETPLACE_EXPERIENCE_REDESIGN.md](./MARKETPLACE_EXPERIENCE_REDESIGN.md) (Yike 2.0 P0)

---

## Mission

Make Yike feel **alive** using inventory already on the page. No AI, no recommendation engine, no new APIs, no schema changes — only better hierarchy, themed rails, and discovery presentation so someone opens the app and wants to keep browsing.

Benchmark: *“I’ll just browse for five minutes…”* → twenty minutes later still exploring.

---

## Confirmation — Feature Freeze

| Area | Changed? |
|------|----------|
| Database / migrations | No |
| HTTP APIs / RLS / auth | No |
| Search engine internals | No |
| Media Protection pipeline | No |
| Verification / business logic | No |
| Routes (new product surfaces) | No — only existing `/`, `/vehicles`, `/search`, `/agents/…` links |
| Admin | No |

**What changed:** Client/server **presentation** components and in-memory slicing of listing pools already fetched for the homepage.

---

## Homepage sections (order)

1. Vehicles \| Properties toggle  
2. Quick Finder (mobile; desktop keeps hero search)  
3. Popular Searches (expanded)  
4. Browse Categories (counts from live pool when available)  
5. Quick Filter chips  
6. Featured Vehicles / Featured Near You  
7. Verified Dealers (from listing `agent` embeds)  
8. Trending This Week  
9. Recently Added  
10. Premium Listings / Featured Properties  
11. SUVs · Pickups · Commercial Vehicles (or Commercial Property)  
12. Luxury Collection  
13. Budget Deals (Under ₦5M)  
14. Near You (when location known)  
15. Latest Listings / Properties You May Like  
16. Popular Cities (12-city grid)  
17. Trust badges strip  

Ad slots retained between major rails.

---

## Discovery improvements

| Improvement | Approach |
|-------------|----------|
| Themed rails | In-memory filters on existing vehicle/property pools (`discovery-from-pool.ts`) |
| Popular searches | Expanded make/type chips → existing `/vehicles` & `/search` URLs |
| Category cards | Icon, name, **real** available count from pool (never invents 14k), subtitle, hover lift |
| Browse by City | 12 Nigerian cities → existing filtered routes |
| Verified Dealers | Cards from unique verified/dealer agents already joined on listings |
| Quick filters | Horizontal chips merging known query params (`verified`, `transmission`, `category`, budgets…) |
| Empty states | `DiscoveryEmptyPanel` — popular categories, trending, cities, try another filter |
| Search pre-query | Rich suggestions + empty panel; property quick chips on `/search` |
| Listing cards | Image → **price** → name → trust → specs → location → save |
| Trust | Badges on cards/detail; dealer verified row; HomeTrustBadges retained |
| Motion | Subtle hover translate/scale on cards, chips, categories — CSS only |

---

## Reusable components

Under `src/components/marketplace/experience/`:

- `DealerDiscoveryRow`
- `CityBrowseGrid` (+ `VEHICLE_CITY_BROWSE` / `PROPERTY_CITY_BROWSE`)
- `QuickFilterChips` (+ vehicle/property chip sets)
- `DiscoveryEmptyPanel`
- Upgraded `CategoryBrowseGrid`, `PopularSearchChips`

Helpers: `src/lib/home/discovery-from-pool.ts`

---

## Screens modified

- `src/app/(public)/page.tsx` — extra rail slices, dealers, category counts  
- `src/components/home/home-marketplace-experience.tsx` — discovery journey composition  
- `src/app/(public)/vehicles/page.tsx` — quick filters + discovery empty  
- `src/app/(public)/search/page.tsx` — quick filters + discovery empty  
- `src/components/search/search-suggestions.tsx` — richer empty exploration  
- `src/components/marketplace/vehicle-card.tsx` / `property-card.tsx` — hierarchy polish  
- Vehicle agent select includes `company_name`, `public_slug`, `created_at`, `listing_limit` for dealer cards (existing columns only)

---

## Why this improves browsing behaviour

- **Scroll gravity:** Many short, themed sections beat one long grid.  
- **One-tap intent:** Popular searches, categories, cities, and chips remove typing friction.  
- **Trust without lectures:** Verified dealer/seller surfaces appear mid-browse.  
- **Never dead-end:** Empty filter results still offer exploration.  
- **Honest counts:** Category “available” numbers reflect the loaded pool — not marketing fiction.

---

## Performance impact

- No new network round-trips beyond the existing home pool fetch (still featured + recent + local).  
- Extra work is **in-memory** filtering/slicing.  
- Rails continue to use `next/image`, lazy loading below the fold, and compact browse grids.  
- Quick filter / nav components are light client islands; empty panel reads recent searches from `localStorage` only.  
- Expected CWV impact: neutral if inventory size stays within current fetch limits (≤ ~36–48 listings).

---

## Mobile improvements

- Sticky Vehicles \| Properties preserved.  
- Horizontal chip/city/dealer rows with hidden scrollbars.  
- Discovery journey above the fold on small screens.  
- Bottom nav unchanged as primary chrome.

---

## Accessibility review

- Section headings remain real `<h2>` / labelled regions.  
- Chips and cards are links/buttons with visible focus via existing `pressable` patterns.  
- Dealer “View store” is text, not icon-only.  
- Trust badges include readable labels (not colour alone).  
- Escape/backdrop close retained on marketplace nav sheet (P0).  
- Avoid inventing metrics (e.g. response rate) when data is absent.

---

## Launch risk

P1 discovery polish **does not** clear supply, FAT, Auth (C07–C08), or media smoke (C12). Company GO/NO-GO remains ops/supply gated.
