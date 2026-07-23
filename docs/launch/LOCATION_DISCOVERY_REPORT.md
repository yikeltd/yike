# Location Discovery Report

**Date:** 2026-07-23  
**Status:** Implemented locally · **Do not commit until founder review**  
**Principle:** Local-first discovery — never default to Lagos/Abuja unless that is the user’s location or no closer inventory exists.

---

## What shipped

### Preference model
- Preferred marketplace location: `{ state, city, area?, lat?, lng?, source, updatedAt }`
- Sources: `geo` | `manual` | `search` | `inferred` | `cookie`
- Storage: `localStorage` (`yike_marketplace_location`) + cookies (`yike_pref_city|state|area|lat|lng`)
- Server reads cookies via `getServerMarketplaceLocation()` for SSR rails

### First-visit detection
1. Request browser geolocation once (no external geocoder)
2. Resolve nearest Nigerian city from local centroids (~45 major cities/capitals)
3. If denied/unavailable → State → City picker modal
4. Prompt remembered (`yike_location_prompt_seen`) — no nag loops
5. Users can change anytime via **📍 City** chip beside search

### Discovery order (rails)
1. Same City  
2. Nearby Cities (~80 km via centroids)  
3. Same State  
4. Nearby States (adjacency map)  
5. Nationwide Featured (lower on page)

### Honest expansion
When city inventory is thin, rails expand and subtitles say so  
(e.g. “Expanded to cities near Yola”, “Showing more across Adamawa”).

---

## Primary files

| Area | Path |
|------|------|
| Core lib | `src/lib/marketplace-location/*` |
| Cookies | `src/lib/search-pref-cookies.ts` |
| Server prefs | `src/lib/search-preferences.ts` |
| Rails | `src/lib/home/inventory-rails.ts` |
| Homepage | `src/app/(public)/page.tsx` |
| Experience UI | `src/components/home/home-marketplace-experience.tsx` |
| Picker / chip / bootstrap | `src/components/location/*` |
| Headers | `header-desktop.tsx`, `header-mobile.tsx` |

---

## Validation

- Cookie `city=Aba&state=Abia` → titles: **Featured in Aba**, **Recently Added in Aba**, **Trending in Your City**; Aba inventory (Osisioma) prioritized
- Cookie `city=Yola&state=Adamawa` → **Featured in Yola**, **Recently Added in Yola**; Jimeta/Dougirei DEMO fixtures surface; DEMO banner shows `location: Yola`
- No Lagos/Abuja bias when preferred city is set
- `npx tsc --noEmit` clean

## Migrations

**None.** Preference is client/cookie + existing `state`/`city` listing fields.
