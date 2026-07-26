# Yike Design System (YDS)

**Status:** v1 — permanent design governance  
**Mission:** Consistency. Six months from now the platform still feels designed by one team, one philosophy, one visual language.  
**Product OS:** [Intelligent Marketplace](../product/INTELLIGENT_MARKETPLACE.md)  
**Token source of truth (runtime):** `src/app/globals.css` (`:root` + `@theme inline`)

This is not a UI kit dump. This is the **design operating system** for Yike.

---

## 1. Design principles

1. **₦50M purchase mindset** — design every listing screen as if someone is about to spend tens of millions of naira. Clarity, confidence, and emotional engagement over information dump.  
2. **System first** — automate, suggest, collapse; user confirms.  
3. **One fact, one place** — never duplicate price, specs, trust, or dealer.  
4. **Progressive disclosure** — above the fold: decide; rest: expand.  
5. **Premium calm** — PalmPay smoothness · Airbnb cleanliness · Zillow trust.  
6. **Mobile-first Nigeria** — large tap targets, readable on 3G, no clutter.  
7. **Trust is compact** — one TrustModule, not essay walls.  
8. **Reuse over reinvent** — extend existing components; do not fork styles.  
9. **Honest UI** — never invent metrics for empty states.

---

## 2. Color system

| Token | Role | Value |
|-------|------|-------|
| `--navy` / `#031B4E` | Primary / nav / dark foundation | Brand |
| `--gold` / `#E4B547` | CTAs, badges, verified, highlights | Accent |
| `--background` | Page base (light: white) | Surface |
| `--surface` / `--warm-neutral` | Soft gray / warm page rhythm | Surface |
| `--elevated` | Cards / elevated panels | Surface |
| `--foreground` | Primary text (charcoal-navy) | Text |
| `--muted` | Secondary / helper text | Text |
| `--danger` | Errors / destructive | Feedback |
| `--badge-emerald` etc. | Status chips only | Feedback |

**Do:** navy + gold + warm white surfaces, soft shadows, generous whitespace.  
**Don’t:** purple-indigo AI defaults, dense admin tables on consumer routes, competing accent rainbows.

Dark theme tokens live under `.dark` in `globals.css`. Prefer CSS variables over raw hex in new UI.

---

## 3. Typography

Use purposeful scale (Tailwind + brand). Prefer existing type rhythm over one-off `text-[13px]`.

| Role | Guidance |
|------|----------|
| Display / Hero | Rare; brand-led landing only |
| Section title | Bold navy; one per section |
| Card title | Strong; clamps to 2 lines on grids |
| Body | Comfortable reading; short paragraphs |
| Caption / metadata | `--muted`; dates, km, LGA |
| Label | Form labels; never shout |
| Badge | Short; sentence case or title case consistently |

Consumer app: Inter via `--font-sans`. Do not introduce a second display font without founder approval.

---

## 4. Spacing (8px grid)

| Token | Rem | px |
|-------|-----|-----|
| `--space-1` | 0.25rem | 4 |
| `--space-2` | 0.5rem | 8 |
| `--space-3` | 0.75rem | 12 |
| `--space-4` | 1rem | 16 |
| `--space-5` | 1.25rem | 20 |
| `--space-6` | 1.5rem | 24 |
| `--space-8` | 2rem | 32 |
| `--space-10` | 2.5rem | 40 |
| `--space-12` | 3rem | 48 |
| `--space-16` | 4rem | 64 |

Prefer Tailwind scale that maps to this grid (`p-2`, `p-4`, `gap-3`, `gap-6`…). Avoid random `17px` / `13px` spacing.

**Max widths:** marketplace content ~`max-w-6xl` / existing page shells; do not invent a third content width per page.

---

## 5. Radius & elevation

| Token | Use |
|-------|-----|
| `--radius-tile` | Small tiles / chips containers |
| `--radius-card` | Default cards / panels (~20px) |
| `--radius-card-lg` | Hero / large media frames |
| `--radius-search` | Search bars |

| Shadow | Use |
|--------|-----|
| `--shadow-card` | Listing / dealer cards |
| `--shadow-card-hover` | Hover lift |
| `--shadow-float` / `-lg` | Floating bars / sticky CTAs |
| `--shadow-glow-gold` | Primary gold CTA emphasis (sparingly) |

---

## 6. Motion

| Token | Use |
|-------|-----|
| `--duration-fast` (150ms) | Hover / press |
| `--duration-normal` (280ms) | Expand / drawer |
| `--ease-out` | Default easing |

Motion communicates state (expand, success, nav)—never entertains. Honor `prefers-reduced-motion`. Existing `.pressable` pattern for tap feedback.

---

## 7. Component library (reuse map)

Prefer these over new one-offs:

| Need | Look first |
|------|------------|
| Trust | `TrustModule`, `TrustBadge` / `TrustBadgeRow` |
| Specs collapse | `CollapsibleSpecs` / experience barrel |
| Listing cards | Existing property / vehicle card components |
| Filters / chips | `SearchFilterChips`, QuickFilterChips |
| Photos | `ListingPhotoManager` + media pipeline |
| Forms | Existing agent listing forms; themed selects |
| Empty / safety | Shared empty patterns + `MarketplaceSafetyTipsLink` |
| Admin | Lex patterns only under `/lex` — do not bleed admin chrome into consumer |

**Rule:** Never recreate buttons, chips, badges, or cards with divergent radius/shadow/padding. Extend.

---

## 8. Information hierarchy

Every page declares:

1. **Primary** — decide + act (price, trust, CTA)  
2. **Secondary** — description, dealer once, highlights  
3. **Expandable** — full specs, amenities, policies  
4. **Metadata** — posted date, ids for staff only  
5. **Footer / Layer 4** — related, safety resources  

Never present everything at equal weight.

---

## 9. Progressive disclosure standard

Above the fold: only what helps decide.  
Everything else: expandable, collapsible, contextual.

Buyer Layer 1–4 and seller stepped flows: [Intelligent Marketplace](../product/INTELLIGENT_MARKETPLACE.md).

---

## 10. Visual language

**Feel:** soft navy foundations, luxury white surfaces, charcoal typography, gold accents, large imagery, rounded premium cards, soft shadows, generous whitespace.

**Avoid on consumer:** dashboard grids, large empty white boxes, flat dense tables, old admin aesthetics, pill-stat spam, multi competing CTAs.

---

## 11. Iconography

Lucide (or existing set) only. Consistent stroke and size per context (`h-3.5` / `h-4` / `h-5`). Icons aid recognition—not decoration clusters.

---

## 12. Copywriting system

Short. Human. Actionable. See `.cursor/rules/yike-copy-style.mdc`.

| Avoid | Prefer |
|-------|--------|
| Submit | Publish listing |
| Proceed | Continue |
| Error | Something went wrong. Please try again. |
| Technical dumps | `friendlyPublicError()` |

One warning once. Collapse legal/safety behind Learn more / View details.

---

## 13. Empty states

Never a dead end. Include: short message, primary action, and at least one alternative (nearby, similar category, popular search, verified dealers, budget alternatives)—using **real** inventory queries when possible.

---

## 14. Loading states

Prefer skeletons and placeholders over spinners. Every async surface needs a graceful transition. Image: blur / skeleton via existing media patterns.

---

## 15. Accessibility

- Readable contrast (navy on white / gold on navy carefully)  
- Keyboard: accordions (`aria-expanded` or native `details`)  
- Touch targets ≥ ~44px (`min-h-11` pattern)  
- Focus rings visible  
- Screen-reader labels on icon-only controls  

Accessibility is part of premium quality.

---

## 16. Responsive design

Mobile-first. Desktop is intentional layout—not stretched phone. Tablet gets considered columns. Sticky CTAs must not cover primary content permanently without safe padding.

---

## 17. Design review checklist (merge gate)

Before **any** future screen merges:

- [ ] Does this reduce user effort?  
- [ ] Can the system automate part of this?  
- [ ] Is information shown only once?  
- [ ] Is there a clear visual hierarchy?  
- [ ] Does it follow spacing / color / radius tokens?  
- [ ] Does it reuse existing components?  
- [ ] Does it use existing typography?  
- [ ] Does it reduce cognitive load?  
- [ ] Is it accessible?  
- [ ] Is it responsive?  
- [ ] Is it performant (lazy media, no heavy deps)?  
- [ ] Does it increase trust?  
- [ ] Is the primary action obvious?  
- [ ] Can advanced information remain hidden?  
- [ ] Does it feel premium?  
- [ ] Are metrics honest (no invented numbers)?  

If **any** answer is No → not ready.

---

## 18. Do’s and don’ts

**Do**

- Ask “how can Yike do this for the user?”  
- Collapse advanced filters and specs  
- Use TrustModule once  
- Suggest titles from known vehicle facts  
- Ship skeletons and empty-state next steps  

**Don’t**

- Duplicate year/make/price across blocks  
- Mid-page safety novels  
- Hardcode one-off hex/radius per screen  
- Invent response rates or “fair price” without data  
- Build a second design language under `/lex` bleed into consumer  

---

## 19. Versioning

- **YDS v1 (2026-07-26):** tokens documented; Intelligent Marketplace OS locked; Phase 1 IA shipped.  
- Future token/component additions append here; do not fork parallel “design language” docs without retiring this file.

---

## Final product principle

> **Yike should always feel easier than users expect.**

The platform thinks before the user has to. Simplifies before it asks. Guides before it explains. Automates before it requests.

Goal: Nigeria’s benchmark for premium digital marketplace experiences—design, trust, and intelligent workflows together.
