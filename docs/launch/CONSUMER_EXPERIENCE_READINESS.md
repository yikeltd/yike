# Consumer Experience Readiness — Multi-Category Shell IA

**Status:** HOLD — do not commit until founder review  
**Date:** 2026-07-23  
**Scope:** Consumer shell information architecture only (home, nav, footer, brand copy, discovery rails). No backend redesign. No new vertical product systems.

---

## Verdict

Consumer shell now presents Yike as **Nigeria’s trusted multi-category marketplace** with **Property and Vehicles at equal prominence**, plus tasteful future entry points for Jobs / Services / Electronics. Vehicle SSOT and routes on `main` are reused — not rebuilt.

**Ready for founder visual QA on localhost.** Not ready to ship until review + explicit commit approval.

---

## Phase outputs

### 1. Homepage

| Surface | Change |
|---------|--------|
| Mobile hero | Badge “Nigeria’s trusted marketplace”; search title “Find Property & Vehicles…”; **category rail** in first viewport (Property \| Vehicles + Jobs/Services/Electronics chips) |
| Desktop hero | “Property. Vehicles. All on Yike.”; dual CTAs Find Property + Browse Vehicles; category rail below search overlay |
| Marketplace intro | Wired into home; multi-category copy + vertical switcher + Vehicles/Jobs quick links |
| Vehicles rail | `HomeVehiclesSection` — lists approved vehicles or empty-state CTA to `/vehicles` |

### 2. Navigation

| Surface | Change |
|---------|--------|
| Desktop header | **Property** + **Vehicles** as primary links; property sub-links retained; CTA shortened to “List” |
| Bottom nav | Still **Home · Swipe · Search · Saved · Profile** — Vehicles not a 6th tab. Search stays hub; **active on `/search` and `/vehicles`** |
| Footer | Marketplace blurb; Explore leads with Property + Vehicles; Careers/Jobs; disclaimer covers properties **and** vehicles |
| Mobile header search | Aria/placeholder acknowledge marketplace (not homes-only) |

### 3. Brand copy / SEO

| Constant / meta | New positioning |
|-----------------|-----------------|
| `SITE_TAGLINE` | Property + vehicles marketplace |
| `COMPANY_DESCRIPTION` | Multi-category |
| `brand.tagline` | Same |
| Root `layout.tsx` title / OG / Twitter | Property & Vehicles Marketplace |
| Home page metadata + JSON-LD | Marketplace, not housing-only |
| Structured data `knowsAbout` | Includes vehicles |

### 4. Discovery

- Property rails unchanged (showcase / featured / for-you) with softened “homes-only” titles.
- Vehicles rail uses existing `queryPublicVehicles` — **empty state is intentional** when 0 approved vehicle listings.

### 5. Future categories (entry points only)

| Category | Behavior |
|----------|----------|
| Jobs | Links to existing `/careers` (badge “Careers”) — no jobs marketplace product |
| Services | Coming-soon chip (no link) — `/services` remains 404 unless `ENABLE_HOME_SERVICES` |
| Electronics | Coming-soon chip — no backend |

---

## Files touched

**New**

- `src/components/home/home-category-rail.tsx`
- `src/components/home/home-vehicles-section.tsx`
- `docs/launch/CONSUMER_EXPERIENCE_READINESS.md` (this file)

**Updated**

- `src/components/home/home-mobile-hero.tsx`
- `src/components/home/home-desktop-hero.tsx`
- `src/components/home/home-marketplace-intro.tsx`
- `src/components/home/home-sections.tsx`
- `src/components/layout/header-desktop.tsx`
- `src/components/layout/primary-bottom-nav.tsx`
- `src/components/layout/site-footer.tsx`
- `src/components/search/header-mobile-search.tsx`
- `src/components/seo/structured-data.tsx`
- `src/lib/constants.ts`
- `src/lib/design/tokens.ts`
- `src/app/layout.tsx`
- `src/app/(public)/page.tsx`

**Left alone (by design)**

- Hardening commit `de681ff8` / auth-signup recovery paths
- Marketplace SSOT (`src/lib/marketplace/*`)
- Jobs/Services/Electronics product backends

---

## Local validation

```bash
npm run dev
# Preview:
#   http://localhost:3000/
#   http://localhost:3000/vehicles
#   http://localhost:3000/search
#   http://localhost:3000/careers
```

Checklist:

- [ ] First viewport reads multi-category (not housing-only)
- [ ] Property → `/search` (or rent flow); Vehicles → `/vehicles`
- [ ] Bottom nav Search highlights on `/vehicles`
- [ ] Saved / Sign In / Profile still work
- [ ] Vehicles empty state acceptable if 0 listings
- [ ] Jobs chip → `/careers`; Services/Electronics non-navigating soon chips

---

## Risks

1. **SEO title change** — broader marketplace keywords may temporarily dilute pure “houses for rent” SERP intent; intentional per founder override.
2. **Desktop header density** — Property + Vehicles + existing links may wrap on mid-width laptops; monitor ~1024–1280px.
3. **Mobile hero height** — Category rail under search increases first-viewport height; acceptable for IA clarity.
4. **Launch flag** — If `ENABLE_VEHICLE_MARKETPLACE=false`, Vehicles CTAs/rail hide; Property path unchanged.
5. **No commit/push** — tree is dirty until founder reviews.

---

## Founder note

**Do not commit until review.** This is a consumer-shell IA refresh only. Ship after visual QA + explicit go-ahead.
