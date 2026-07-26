# UI Regression Report — Mobile Homepage Hero

**Date:** 2026-07-26  
**Severity:** P0 visual regression (founder-approved mobile home)  
**Status:** Restored

---

## What went wrong

This was **not** a deliberate redesign. It was a **merge/hotfix regression**.

| Item | Detail |
|------|--------|
| **Regression commit** | `8cafa761` — `fix(ux): stop footer scroll jumps and restore mobile home sticky.` |
| **File overwritten** | `src/components/home/home-marketplace-experience.tsx` |
| **Component reintroduced** | `HomeMobileHero` (navy skyline + `BrowseListingsBlock` `home-premium` + category rail) |
| **Approved baseline** | RC1 `c56ae5c9` / parent of `8cafa761` — **inventory-first mobile** |

### Root cause

While fixing `ScrollRetention` footer jumps and Vehicles|Properties sticky behaviour, the agent incorrectly concluded that “missing mobile hero” meant remount `HomeMobileHero`.

Docs already locked the opposite:

- `docs/launch/HERO_RESPONSIVE_LAYOUT_REPORT.md` — *“Mobile homepage remains inventory-first (`lg:block` hero only).”*
- `docs/launch/PRODUCTION_READINESS_HOMEPAGE_SIMPLIFICATION.md` — *“Mobile home: inventory-first, location in header only.”*
- `docs/launch/RESPONSIVE_BREAKPOINT_REPORT.md` — sticky toggle + listings immediately

So the **approved** mobile “hero” is: sticky category control + inventory — **not** the older full-bleed search hero.

---

## Restore applied

| Action | Detail |
|--------|--------|
| Removed | `HomeMobileHero` from homepage mobile tree |
| Removed | `StickyMarketplaceCategoryBar` wrapper added in `8cafa761` |
| Restored | RC1 sticky `MarketplaceCategoryToggle` + inventory-first rails |
| Preserved | `ScrollRetention` popstate-only restore (`8cafa761`) |
| Preserved | City-card density (`618f2d2f`), nav/vehicles/account hotfixes |
| Locked | Comment in experience + `HomeMobileHero`; new Cursor rule |

`HomeMobileHero` file remains for legacy `home-search-hero` only — **not** mounted on `/`.

---

## Files restored / touched

| File | Change |
|------|--------|
| `src/components/home/home-marketplace-experience.tsx` | Restore inventory-first mobile chrome |
| `src/components/home/home-mobile-hero.tsx` | Document homepage lock-out |
| `.cursor/rules/approved-ui-freeze.mdc` | Prevent silent UI replacements |
| `docs/launch/UI_REGRESSION_REPORT.md` | This report |

---

## Validation

| Check | Expected |
|-------|----------|
| Mobile `/` first viewport | Sticky Vehicles\|Properties, then Featured/inventory — **no** navy search hero |
| Desktop `/` | `HomeDesktopHero` unchanged |
| Search | Header search + mid-page `QuickFinderBar` still work |
| Listings rails | Unchanged placement order |
| Navigation | Bottom nav / header unchanged |
| ScrollRetention | Still popstate-only (no footer jump on forward nav) |

Local preview: `http://localhost:3000` at ~390px width.

**After restore (local):** `docs/launch/screenshots/home-mobile-after-restore.png`  
— Sticky Vehicles|Properties → Featured inventory (no navy `HomeMobileHero` search block).

**Before (regression on `8cafa761`):** full-bleed navy skyline + deal/type/budget filters above inventory.

---

## Prevention

1. **Approved UI freeze** rule for `src/components/home/**`.
2. Hotfixes must not “restore” visual components without checking launch docs.
3. Prefer stabilizing routes/interactions over homepage redesign until after launch.
