# Swipe Experience Report — Discover 2026

**Status:** Ready for review · **Do not commit until approved**  
**Product name:** Discover (user-facing) · Interaction: swipe gestures  
**Canonical route:** `/discover`

---

## Objective

Replace the Search bottom-nav tab with a centered, gold-elevated **Discover** experience — a premium property/vehicle discovery engine, not a restored dating-app clone of the old `/browse` swipe.

---

## Navigation

| Before | After |
|--------|--------|
| Home · Search · Saved · Sell · Account | Home · Saved · **Discover** · Sell · Account |

- Discover sits in the **exact visual centre** as an elevated gold circular FAB (~56px), lifted above the pill bar.
- Press animation via `pressable` + `active:scale-95`.
- Search removed from bottom nav; still available from homepage, Discover header, and listing/search pages.

---

## Routes & chrome

| Path | Behaviour |
|------|-----------|
| `/discover` | New immersive Discover deck (mobile) + desktop fallback |
| `/swipe`, `/swipe-homes`, `/browse` | Redirect → `/discover` |
| Consumer shell | Headers hidden on Discover; **bottom nav kept** |

Sitemap updated to `/discover`. Hub links and guest-saved CTAs point to Discover.

---

## Discovery experience (new UI)

Built under `src/components/discover/` — **not** a restyle of `horizontal-browse.tsx`.

### Card
- Edge-to-edge hero (`MotionSlide`)
- Price, title, location
- Verified + Featured badges
- Favourite control, photo count
- Quick specs (beds/baths or year/make/mileage)
- Tiny seller avatar
- Swipe-down expands description panel

### Gestures (physics drag)
| Gesture | Action |
|---------|--------|
| Right | Interested / Save |
| Left | Skip |
| Up | Open full listing |
| Down | Quick details panel |

Live translate + rotation, exit animations, next-card peek, spring-back, light haptic (`navigator.vibrate`) when supported. Low-data mode shows Skip / Save / Open buttons.

### Filters (in-place)
Properties | Vehicles · Buy/Rent/Land · State · City · Budget · Featured · Verified  
Applying filters rebuilds the deck without leaving the screen.

### Empty state
> You've seen everything matching your filters.

Actions: Refresh · Expand radius · Increase budget · Explore nearby cities.

### Header search
Filter + Search icons — Search routes to `/search` or `/vehicles` based on category.

---

## Personalisation

Reuses existing infrastructure:

- `browse-preferences` (cities, types, budget, viewed/saved/hidden)
- `buildBalancedBrowseFeed` / `rankPropertiesForBrowse`
- Swipe memory + preload + dwell/pace analytics (`placement` / source `"discover"` on saves)

Each skip/save/view updates prefs so the next session ranks smarter.

---

## Validation

| Check | Result |
|-------|--------|
| Discover centred + elevated gold FAB | Yes |
| `/discover` returns 200 | Yes |
| `/swipe` and `/browse` redirect to `/discover` | Yes (308 → 200) |
| Search still on homepage / Discover header / `/search` | Yes |
| Mobile immersive + bottom nav visible | Yes |
| Desktop calm fallback | Yes |
| Old browse components left in repo (unused) | Yes |
| Typecheck clean for Discover changes | Yes |

Preview (mobile width): [http://127.0.0.1:3000/discover](http://127.0.0.1:3000/discover)

---

## Key files

- `src/components/layout/primary-bottom-nav.tsx`
- `src/components/layout/consumer-shell.tsx`
- `src/lib/route-redirects.ts`
- `src/app/(public)/discover/page.tsx`
- `src/components/discover/*`
- `src/lib/discover/filters.ts`, `feed.ts`

---

## Not in this pass

- No commit / push (awaiting review)
- No deletion of legacy `src/components/browse/*`
- No AI recommender — preference ranking only
