# Design Excellence Sprint

**Status:** Craftsmanship pass shipped (presentation only)  
**Date:** 2026-07-26  
**Principle:** Design every screen as if someone is about to spend ₦50 million.  
**Doctrine:** [Intelligent Marketplace](../product/INTELLIGENT_MARKETPLACE.md) · [YDS](./YIKE_DESIGN_SYSTEM.md)

---

## Mission

Not a redesign. Not features. Not backend.

Improve craftsmanship so a first-time mobile user thinks within three seconds:

> This feels expensive. Trustworthy. Modern. Effortless.

**Hard freeze respected:** no database, API, auth, search logic, routing, permissions, or admin behaviour changes.

---

## Screens reviewed

| Screen | Focus |
|--------|--------|
| Vehicle detail | Hero immersion, above-fold, trust, specs, CTA, dealer card, chrome |
| Property detail | Hierarchy, trust, CTA, dedupe beds/baths, sticky contact |
| Sticky contact bar | Appear only after primary CTA leaves viewport |
| Mobile header | Hide search chrome on vehicle + property detail |
| Consumer shell | Edge-to-edge listing detail layout |
| TrustModule / Spec cards | Compact trust; Apple-style value-first specs |

Homepage / search / sell / account: audited for consistency against YDS; no invasive redesign this sprint (freeze + craftsmanship scope on highest-trust surfaces).

---

## Visual improvements

- Soft navy-tinted page gradient; elevated white summary surfaces with quieter borders  
- Vehicle gallery taller on mobile (`5/6` → desktop `16/10`), edge-to-edge, elegant counter  
- Dealer “business card”: banner strip, logo over ring, verification + member since, View showroom  
- Spec tiles: value dominant, label quiet, soft icon well (not navy blocks shouting)  
- Trust chips without a heavy nested card frame  

---

## UX / hierarchy improvements

Above-fold path (both verticals):

1. Gallery  
2. Price (dominates)  
3. Title  
4. Location  
5. Trust  
6. 4–6 quick specs  
7. Primary WhatsApp CTA  
8. Save / Share secondary  

Emotional arc: desire → confidence → understanding → trust → contact.

---

## Repetition removed

- Vehicle: year / fuel / transmission / mileage / condition / exterior shown as quick chips are **not** re-led in the specs accordion (deep specs only; accordion still has full set if no chips).  
- Property: beds/baths only in quick chips — not duplicated as CollapsibleSpecs rows.  
- Sticky WhatsApp no longer permanently duplicates the in-page primary CTA.  

---

## Trust improvements

- TrustModule collapsed to chip strip + Learn more  
- Safety essay stays Layer 4 / expandable only  
- Dealer verification referenced once on dealer card  

---

## CTA improvements

- Primary: Chat on WhatsApp  
- Secondary: Call · Save · Share · Report (collapsed)  
- `StickyContactBar` uses IntersectionObserver on `#listing-primary-cta` — shows only after that block scrolls away  
- Property mobile now includes in-page primary CTA (was sticky-only before)  

---

## Typography & layout

- Larger price tabular numerals  
- Quieter titles and metadata  
- Tighter secondary chip styling  
- Reduced header competition: mobile search header hidden on `/properties/*` and `/vehicles/[slug]`  
- Compact back control on vehicle detail  

---

## Components refined

| Component | Change |
|-----------|--------|
| `vehicle-premium-detail.tsx` | Hierarchy, surfaces, dealer card, CTA anchor, dedupe |
| `vehicle-detail-hero.tsx` | Immersive mobile aspect + counter polish |
| `trust-module.tsx` | Slimmer, less visual weight |
| `collapsible-specs.tsx` | Value-first Apple-style tiles |
| `sticky-contact-bar.tsx` | Scroll-gated visibility |
| `header-mobile.tsx` / `consumer-shell.tsx` | Detail chrome minimization |
| `properties/[slug]/page.tsx` | Above-fold reorder + primary CTA |
| `agent-trust-card.tsx` | CTA anchor id for observe |

---

## Before vs after rationale

| Before | After |
|--------|--------|
| Search header on vehicle detail competed with media | Immersive content-first detail |
| Sticky WhatsApp always on = dual primary CTAs | Sticky only when needed |
| Specs felt like DB rows / competing labels | Value-first premium tiles |
| Trust framed as another card competing with price | Quiet chip strip |
| Property mobile relied only on sticky contact | In-page CTA then sticky follow |

---

## Performance impact

- No new network requests or schema  
- IntersectionObserver is lightweight; no sticky DOM when CTA visible  
- Gallery still lazy-adjacent / priority first image only  

---

## Accessibility review

- Sticky region labelled “Contact seller”  
- Trust Learn more via native `details`/`summary`  
- Specs accordion keyboard-friendly  
- Back link on vehicle detail for when header is hidden  
- Focus rings retained on gallery controls  

---

## What we deliberately did not do

- Invent response-time / fair-price metrics  
- Rebuild galleries with new libraries  
- Touch Lex admin or search ranking  
- Homepage / browse full redesign  

---

## Final product standard

Stop when it feels inevitable—not when it merely works.

Benchmark: vs any Nigerian marketplace, Yike should feel more premium, more trustworthy, and easier to use—especially when the purchase is life-changing money.
