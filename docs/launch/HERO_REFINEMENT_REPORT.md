# Hero Refinement Report — Design Language 2026

**Status:** Ready for review · **Do not commit until approved**  
**Scope:** Desktop homepage hero only (`lg+`). Mobile inventory-first layout unchanged.

---

## Objective

Calm the crowded desktop hero so attention flows:

**Navigation → Headline → Search → Action**

Marketplace feel over marketing-landing-page noise.

---

## What changed

| Before | After |
|---|---|
| Floating “Trusted Across Nigeria” card (right) | Removed |
| Three statistic pills (Fresh / Trust-checked / 36 states) | Removed from hero |
| Dual CTAs (Find Properties + Browse Vehicles) | Removed — search panel owns the single CTA |
| Search overhanging bottom of panel | Search sits in-flow under toggle |
| Heavy multi-layer overlays | Two lighter gradients only |
| “Find. Rent. Buy. Drive. Everything on Yike.” | “Find your next property or vehicle.” |
| Supporting: “Search verified property and vehicles…” | “Verified listings from trusted sellers across Nigeria.” |

---

## New hierarchy

1. Eyebrow — Nigeria’s Trusted Marketplace  
2. Headline — Find your next property or vehicle.  
3. Short description  
4. Properties / Vehicles toggle (when vehicles launch flag is on)  
5. Large search panel with **one** primary CTA  
   - Properties → **Search Properties**  
   - Vehicles → **Search Vehicles**  
6. Compact trust strip: ✓ Verified Sellers · ✓ Nationwide Coverage · ✓ Secure Enquiries  

Whitespace increased between eyebrow → headline → copy → toggle → search.

Right side of the panel is intentionally empty so the skyline photography can read.

---

## Trust preserved (not deleted)

- Compact inline trust strip under search (hero footer)
- Existing page-level trust: `HomeTrustBadges`, `HomeWhyYike` further down
- Card component `home-desktop-trusted-agents-card.tsx` left in repo but **no longer mounted** on the homepage

---

## Validation checklist

| Check | Result |
|---|---|
| Hero calmer / less competing elements | Yes |
| Search is primary focal point | Yes — in-flow under headline |
| Trust visible without dominating | Yes — light strip only |
| Desktop balance improved | Yes — image breathes on the right |
| Mobile layout unaffected | Yes — `lg:block` hero; mobile sticky toggle unchanged |
| No search functionality removed | Yes — same property/vehicle search handlers |
| Segment toggle retained | Yes |
| Single segment-aware CTA | Yes — via search panel label |

---

## Files touched

- `src/components/home/home-desktop-hero.tsx` — simplification
- `src/components/home/home-marketplace-experience.tsx` — drop trust-card prop wiring
- `src/components/home/home-search-hero.tsx` — legacy hero call site aligned
- `src/app/(public)/page.tsx` — remove unused trustedAgents pass-through

---

## Preview

Open desktop viewport (≥1024px): [http://127.0.0.1:3000/](http://127.0.0.1:3000/)

Toggle Properties ↔ Vehicles and confirm the search CTA label switches.

---

## Not in this pass

- No homepage redesign beyond hero simplification  
- No commit / push (awaiting review)  
- Admin hero-trusted-agents config APIs left intact for possible future reuse  
