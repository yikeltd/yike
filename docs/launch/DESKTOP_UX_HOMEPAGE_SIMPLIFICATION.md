# Desktop UX Report — Homepage Simplification

**Date:** 2026-07-23  
**Status:** Ready for founder review — **no commit**  
**Breakpoint:** `lg+` (≥1024px)

## Header

| Before | After |
|--------|--------|
| Logo · Buy · Rent · Vehicles · Land · Sell · Safety · **Location** · Sign in | Logo · Buy · Rent · Vehicles · Land · Safety · Sign in · **SELL** |

- Location selector removed (hero search already has city/state).
- “List on Yike” not in header; **SELL** is gold CTA via existing `ListPropertyButton` (auth + seller gate unchanged).
- Sell removed from center nav to avoid duplicate with CTA.

## Hero

- Premium dual-marketplace panel retained (image, category toggle, Find Properties / Browse Vehicles, floating search).
- Supporting copy reduced to one line: *Search verified property and vehicles across Nigeria.*
- Marketing 4-up trust strip under hero **removed**.
- Floating trust card kept as compact checklist only (no buyer-count footer).

## Below hero

Inventory dominates. No explanatory cards. Section titles only (no subtitles). Ads only when creatives exist.

## Interaction notes

- SELL → same list/auth intent as before (`ListPropertyButton`).
- Search panels unchanged → `/search` and `/vehicles`.
- Category toggle still syncs `?category=`.

## Risks / watch

- Search panel overhang spacer adjusted after removing trust strip — verify no collision with first rail on xl.
- Users who relied on header location must use hero search or mobile header (mobile unchanged).

## Commit

**None** — hold until founder review.
