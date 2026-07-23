# Mobile Homepage Validation Report

**Date:** 2026-07-23  
**Status:** Validated · hold commit  

---

## Architecture (unchanged intent)

Inventory-first. **No desktop hero** on mobile / tablet below `lg`.

```
[ Logo | 🔍 Search | Location ▼ ]     ← HeaderMobile
[ Properties | Vehicles ]             ← sticky, lg:hidden
Featured / rails / ads…               ← first viewport listings
```

## Checks

| Check | Result |
|-------|--------|
| No full-bleed marketing hero | Pass — `HomeDesktopHero` is `hidden lg:block` |
| Sticky category switch | Pass — `sticky top-14 … lg:hidden` |
| Listings in first viewport | Pass — rails start immediately under sticky toggle |
| Compact browse cards | Pass — `cardVariant="browse"`, 2-col mobile grid |
| Shared ads / location | Pass — same `HomeAdSlot` + location bootstrap as desktop |
| Header search retained | Pass — mobile header still Logo · Search · Location |

## Intentionally not on mobile

- Desktop hero image / trust strip / trusted agents card
- Desktop hero filter panel
- Desktop marketplace nav links (bottom nav + header search cover discovery)

## Preview

`http://127.0.0.1:3000/` at &lt;1024px width (DevTools or device).
