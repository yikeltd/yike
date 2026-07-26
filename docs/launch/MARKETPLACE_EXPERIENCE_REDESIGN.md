# Marketplace Experience Redesign (Yike 2.0 — Presentation Only)

**Status:** Pre-launch P0 shipped (presentation layer)  
**Feature freeze:** ACTIVE — this initiative is an explicit founder override for **UX/presentation only**  
**Date:** 2026-07-26

---

## Founder executive summary

Yike 2.0 P0 makes discovery **browse-first and trust-first** without touching APIs, schema, auth, or media pipelines. The goal is not to look different from Nigerian classifieds — it is to make it **easier, faster, and more trustworthy** for a Nigerian to discover, evaluate, and confidently contact a seller about a vehicle or property.

**What this helps with before soft-launch**

- Home leads with Quick Finder, popular searches, and category cards so users can act in one or two taps.
- Listing cards surface trust → title → price → specs → location without opening the detail page.
- Detail pages put price and trust signals above the fold; WhatsApp contact, save, share, and report stay intact.
- A light marketplace menu lists existing routes only (no Messages / in-app chat).

**What this does *not* clear**

- Real vehicle/property supply  
- Founder Acceptance Test (FAT)  
- Leaked-password / Auth ops (C07–C08)  
- Media-protection production smoke (C12)  

Company GO/NO-GO remains supply- and ops-gated. Presentation polish improves conversion *feel*; it does not invent inventory or trust metrics we do not have.

---

## Philosophy

1. Optimize for Nigerian discovery confidence, not visual novelty vs Jiji.
2. URL-driven search only — Quick Finder and chips build query params and navigate.
3. Show only signals that existing profile/listing fields already provide (never invent response rate / years-on-Yike).
4. Navy `#031B4E` / gold `#E4B547` — soft navy surfaces and layered cards; no purple/cream AI-generic themes.
5. Mobile-first; bottom nav remains primary chrome.

---

## Ship strategy

| Phase | Scope | Timing |
|-------|--------|--------|
| **P0** (this doc) | Home discovery, Quick Finder, popular searches, category cards, listing cards, vehicle + property detail hierarchy, trust components, light nav sheet, docs | Before soft-launch |
| **P1** | Full hamburger IA depth, search empty-state exploration, filter chips polish, dealer storefront premium | After P0 stable |
| **Out** | In-app Messages, new APIs/DB fields, invented trust metrics | Frozen / V2 |

---

## Architecture (unchanged)

Presentation layer only. Reuse existing loaders (`page.tsx` home data, `queryPublicVehicles`, `getPublicProperties`) and existing `/vehicles` + `/search` URL params.

```
HomeExperience / Cards / Detail / TrustBadges  →  existing Search helpers + APIs
```

Do not touch: API routes, Supabase schema, search query helpers internals, media protection pipeline, auth/RLS.

---

## Components (`src/components/marketplace/experience/`)

| Component | Role |
|-----------|------|
| `TrustBadge` / `TrustBadgeRow` | Verified Dealer/Seller, Verified listing, Media Protected — visual language only |
| `QuickFinderBar` | Location / Make|Type / Budget / Year|Beds → URL navigation |
| `PopularSearchChips` | One-tap links to existing search URLs |
| `CategoryBrowseGrid` | Cards → filtered `/vehicles` or `/search` routes |
| `MarketplaceSection` | Section header + rail spacing |
| `MarketplaceNavSheet` | Sheet of existing links (Vehicles, Properties, Sell, Saved, Safety, Help) |

---

## Screens (before → after)

### Home

- **Before:** Flat rails; weak browse entry; property-leaning composition.
- **After:** Vehicles \| Properties toggle → Quick Finder → popular chips → category browse → vehicle-first rails (Featured Vehicles → … → Properties You May Like → Popular Cities). Ad slots retained.

### Listing cards

- **Before:** Price-first / uneven hierarchy; specs easy to miss.
- **After:** Title → large price → key specs → location (+ trust where available). Essentials visible without opening the listing.

### Detail

- **Vehicles:** Premium layout — gallery → price → trust badges → title/location → contact CTA → specs later.
- **Properties:** Same summary hierarchy (gradient summary card + `TrustBadgeRow`); existing contact/save/report/gallery preserved.

### Header

- Compact menu opens nav sheet of **existing** links. No Messages. Bottom nav unchanged.

---

## Mobile / performance / a11y

- Keep `next/image` on rails; avoid LCP layout thrash.
- Sheet: Escape + backdrop close; body scroll lock while open; AA contrast on gold/navy trust chips and CTAs.
- Deep links, back button, and refresh must keep working for Quick Finder URLs.

---

## Validation checklist

- [ ] Local `/`, `/vehicles`, vehicle detail, `/search`, one property detail — mobile + desktop widths  
- [ ] Quick Finder / chips land on correct query strings  
- [ ] WhatsApp contact, save, share, report still work on detail  
- [ ] No Messages entry anywhere in P0 chrome  

---

## Launch risk note

P0 UX is freeze-compatible presentation polish. It **does not** replace real inventory, FAT, or media-protection smoke. Update Command Center accordingly: initiative noted under polish; blockers unchanged.
