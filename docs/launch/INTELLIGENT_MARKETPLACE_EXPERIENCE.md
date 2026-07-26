# Intelligent Marketplace Experience (Phase 1 ship notes)

**Status:** Phase 1 shipped (IA / UX progressive disclosure)  
**Product OS (permanent):** [INTELLIGENT_MARKETPLACE.md](../product/INTELLIGENT_MARKETPLACE.md)  
**Design governance:** [YIKE_DESIGN_SYSTEM.md](../design/YIKE_DESIGN_SYSTEM.md)  
**Feature freeze:** ACTIVE for APIs / schema / auth / media pipeline internals  
**Date:** 2026-07-26  
**Cursor rules:** `.cursor/rules/intelligent-marketplace.mdc` · `.cursor/rules/yike-design-system.mdc`

---

## Founder executive summary

Yike’s competitive edge is **feeling intelligent**. Progressive Disclosure is one mechanism; the **Intelligent Marketplace** is the operating system. Buyers decide in seconds (what / price / trust / contact). Sellers should not retype what the platform already knows.

Phase 1 removes repetition, collapses trust into one module, layers specifications behind expanders, and guides listing creation with stepped forms using **existing** make→model catalogs and media pipelines—without inventing AI, price bands, or metrics we do not have.

Full “smart listing” (factory trim databases, LLM descriptions, live comps) remains **V2 post soft-launch**. Company GO/NO-GO is still gated by inventory, FAT, and media smoke — not by this IA pass.

---

## Design principle (non-negotiable)

> How can Yike do this for the user instead of asking the user to do it?

> Can we ask the user for less, show them less, and let the system do more?

If yes, revise before merge.

**Progressive disclosure layers**

1. **Layer 1 (above the fold):** Gallery · Price · Title · Trust · Primary CTA  
2. **Layer 2:** Highlights · Description · Dealer (once)  
3. **Layer 3:** Full specs — collapsed by default  
4. **Layer 4:** Related · Safety/policies — never interrupt the buy journey  

Display each fact **once**.

---

## Phase 1 — shipped / shipping

| Area | Change |
|------|--------|
| Buyer vehicle detail | TrustModule; deduped hierarchy; premium collapsed specs |
| Buyer property detail | Same layering; dense walls behind “Full details” |
| Seller vehicle form | Steps; make→model cascade; auto title; advanced collapsed |
| Seller property form | Type-based field groups; hide non-applicable fields |
| Dealer storefront | Showroom hierarchy; TrustModule; no invented metrics |
| Search | Primary filters vs “More filters” |

**No backend logic change** in Phase 1 (same create/update APIs, same verification rules, same media pipeline entry points).

---

## Information architecture improvements

- Remove duplicate year / make / transmission between chips and full specs lists  
- Replace long safety essays mid-page with compact TrustModule + Learn more  
- Specs as icon cards inside accordion, not endless text tables  
- Dealer shown once (card), not re-explained in trust essay  

---

## Listing intelligence roadmap

| Capability | Phase |
|------------|-------|
| Make → model cascade (`vehicle-makes.ts`) | Phase 1 |
| Category-driven field sets (`vehicle-specs.ts`) | Phase 1 |
| Auto title suggestion (editable) | Phase 1 |
| Existing photo compress/watermark via ListingPhotoManager | Phase 1 (reuse) |
| Year → trim / HP / factory specs catalog | V2 |
| LLM description draft | V2 |
| Live price comps (“₦14.2–15.1M”) | V2 |
| Response rate / ratings | V2 (when data exists) |
| Vision blur/dark/angle beyond current pipeline | V2 |

---

## Components

- `TrustModule` — compact trust + expandable Learn more  
- `SpecCardGrid` / accordion wrappers for Layer 3  
- Stepped form chrome (progress + save draft — vehicle drafts already exist)  
- Progressive Disclosure Cursor rule → **Intelligent Marketplace** + **YDS** rules  
- Design system doc: `docs/design/YIKE_DESIGN_SYSTEM.md`  
- Product OS: `docs/product/INTELLIGENT_MARKETPLACE.md`  

---

## Mobile / a11y / performance

- Layer 1 must fit a typical phone viewport without trust walls  
- Accordions keyboard-accessible (`details`/`summary` or button+aria-expanded)  
- No new heavy client bundles; reuse `next/image`  
- Do not invent metrics for empty states  

---

## Confirmation

- Feature freeze respected for DB/API/auth/media internals  
- Progressive Disclosure is the merge gate for future UI → superseded by Intelligent Marketplace + YDS checklists  
- Phase 2+ items live in `V2_BACKLOG.md`  
- Permanent doctrine: `docs/product/INTELLIGENT_MARKETPLACE.md` + `docs/design/YIKE_DESIGN_SYSTEM.md`  
