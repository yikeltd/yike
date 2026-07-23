# Responsive Breakpoint Report

**Date:** 2026-07-23  

---

## Breakpoint strategy

| Range | CSS | Homepage mode |
|-------|-----|---------------|
| `&lt; 1024px` (`default` / `sm` / `md`) | Mobile + tablet | **Inventory-first** — no hero |
| `≥ 1024px` (`lg+`) | Desktop web | **Premium landing** — hero + rails |

Hero gate matches existing `useDesktopWeb` convention (`min-width: 1024px`) and avoids a cramped mid-tablet hero.

## Component visibility

| Element | Mobile / tablet | Desktop |
|---------|-----------------|---------|
| `HeaderMobile` | Visible (`lg:hidden`) | Hidden |
| `HeaderDesktop` | Hidden | Visible |
| `HomeDesktopHero` | Hidden (`hidden lg:block`) | Visible |
| Sticky category bar | Visible (`lg:hidden`) | Hidden (toggle lives in hero) |
| Inventory rails | Visible | Visible |
| Smart ad slots | Visible when active | Visible when active |
| Rail card density | 2 → 3 → 4 cols | 4 → 5 cols (`HOME_RAIL_GRID_CLASS`) |

## Tablet note

`md`–`lg` keeps inventory-first (same as mobile). Sensible hybrid: search + location in header, sticky Properties\|Vehicles, listings immediately — no half-width hero.
