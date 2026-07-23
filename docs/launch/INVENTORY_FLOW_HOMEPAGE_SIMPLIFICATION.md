# Inventory Flow Report — Homepage Simplification

**Date:** 2026-07-23  
**Status:** Ready for founder review — **no commit**

## Goal

Inventory takes the page. Little text. Auto-expand nearby when local city is thin — without long fallback essays.

## Desktop / shared rail order

```
Hero (desktop only)
→ Featured Near You
→ Ad (slot 1)
→ Recently Added
→ Ad (slot 2)
→ Luxury
→ Ad (slot 3)
→ Recommended
→ Ad (slot 4)
→ Popular Cities
→ Compact trust badges
→ Footer
```

### Featured Near You selection

- **Property:** prefer `nearYou` rail when non-empty; else `featured`.
- **Vehicle:** `featured` rail.
- Title: `Featured Near You` when location is set and scope expanded; otherwise localized featured title (e.g. `Featured in Calabar`).

### Recommended

- Prefer trending slice; else nationwide pool.
- Title: `Recommended` / `Recommended for you`.

### Removed from homepage surface

- Separate Nearby Deals / Low Mileage middle sections  
- Extra nationwide rail after Recommended  
- Trending searches chip row  
- Download-app strip  

Server still computes nearYou / lowMileage / nationwide for selection logic; unused middle rails are simply not rendered.

## Empty / thin location

| Situation | UX |
|-----------|-----|
| City thin but inventory elsewhere | **Silent** — nearby/nationwide cards load in rails (no banner) |
| Totally empty | Short: `No listings in {City} yet.` + optional `Showing nearby listings.` + Browse CTAs |
| Demo fixtures (dev only) | Gold `[DEMO]` banner; never in production |

Expansion subtitles like “Showing listings across Nigeria” removed from homepage (section subtitles dropped; `scopeSubtitle` nationwide → silent).

## Ads

Slots 1–4 between the four inventory blocks. Slot 5 unused on this simplified layout (creative can stay in admin; simply not placed).

## Commit

**None** — hold until founder review.
