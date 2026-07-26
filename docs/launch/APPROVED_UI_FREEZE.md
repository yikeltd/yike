# Approved UI Freeze

**Status:** ACTIVE (2026-07-26)  
**Authority:** Founder — treat approved screens as production assets

Also mirrored for agents at `.cursor/rules/approved-ui-freeze.mdc` (local).

## Locked: mobile homepage

**Baseline:** RC1 inventory-first (`c56ae5c9` / pre-`8cafa761`)

1. Desktop only: `HomeDesktopHero`
2. Mobile: sticky Vehicles | Properties
3. Mobile: inventory rails first
4. `QuickFinderBar` after early rails — **not** full-bleed `HomeMobileHero`

Do **not** remount `HomeMobileHero` on `/` without an explicit founder redesign request.

## Allowed without redesign

Bugs, routes, performance, a11y, copy typos, non-visual refactors that keep the same hierarchy and tokens.

## Incident

See [UI_REGRESSION_REPORT.md](./UI_REGRESSION_REPORT.md) (`8cafa761` reintroduced search-first chrome).
