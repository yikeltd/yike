# Responsive Layout Report — Homepage UX

**Status:** Mobile-first preserved

## Header

| Breakpoint | Layout |
|------------|--------|
| Mobile (`< lg`) | Logo · Search (flex-1) · Location ▼ |
| Desktop home | Logo · Search (flex-1, large) · Location ▼ |
| Desktop other | Logo · nav · Account (no List) |

Search takes remaining horizontal space; location is `shrink-0` with truncate + chevron.

## Browse grid

Unchanged column strategy:

- Mobile: **2 cols**
- sm: 3 · md: 4 · lg: 6 · xl: 7 · 2xl: 8

Thumb aspect **`4/3`** (was `4/5`) so more cards fit above the fold without uneven rows.

## Ad banners

- Full width within `max-w-7xl` content padding
- Aspect ~2.4:1 with max-height so ads don’t dominate inventory
- Zero height when inactive

## Sticky chrome

Category toggle sticky offset still matches header heights (`top-14` / `lg:top-[4.25rem]`).
