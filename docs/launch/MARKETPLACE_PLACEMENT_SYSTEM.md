# Yike Marketplace Placement System

**Status:** Presentation layer shipped (v1)  
**Date:** 2026-07-26  
**Principle:** Sell placement, not trust.

---

## Mission

Visibility is inventory. Inventory is monetizable.

Premium placement creates advertising products **without** making Yike feel like a marketplace full of ads. Discovery stays curated. Search, filters, cards, and navigation stay intact.

---

## Design principle

Users should always feel they are browsing a curated marketplace — not a wall of advertisements.

Placement blends into browsing. Trust badges stay earned and never purchasable.

---

## Placement hierarchy (rails)

Suggested discovery order (homepage / inventory-first surfaces):

1. **Featured** — paid / reserved inventory  
2. **Trending** — algorithmic engagement  
3. **Recently Added** — automatic freshness  
4. **Verified Dealers** — trust discovery (not placement)  
5. **All Listings** — remaining browse rails  

Do not treat Featured / Trending / Recently as three equal badges on every card. They are **placement tiers** the marketplace controls.

---

## Placement tiers

### 1. Recently Added

| | |
|--|--|
| Assignment | Automatic |
| Sort | `created_at` desc |
| Payment | None |
| Purpose | Fresh inventory |

### 2. Trending

| | |
|--|--|
| Assignment | Algorithmic |
| Signals | Views, contact clicks, saves/shares when available |
| Interim | High-engagement proxies from existing listing fields; never invent metrics |
| Payment | None (admin override later) |
| Purpose | Marketplace activity |

### 3. Featured

| | |
|--|--|
| Assignment | Paid / admin-controlled promotion |
| Sort | Active featured / boost window |
| Payment | Yes (`Promote listing` → Featured) |
| Purpose | Revenue + top discovery visibility |

---

## Visual distinction

| Tier | Treatment |
|------|-----------|
| Featured | Gold badge · subtle gold ring · first rail · premium, not banner |
| Trending | Orange badge · trend affordance · normal card size |
| Recently Added | Blue / sky “New” · optional time label (today / yesterday / this week) |

**Never** giant advertisement banners for these tiers.

---

## Badge rules (cards)

Maximum **one** placement badge per listing.

Priority:

1. Featured  
2. Else Trending  
3. Else New  

Trust badges remain separate and may coexist:

- Verified Dealer / Verified  
- Yike Verified  
- Media Protected (when shown)

**Never** stack Featured + Trending + New together.

---

## Monetization strategy

| Product | Monetizable? | Notes |
|---------|--------------|-------|
| Featured | Yes | Top homepage / discovery placement |
| Boost | Yes | Ranking advantage (existing promote flow) |
| Trending | No | Earned by engagement |
| Recently Added | No | Automatic |
| Verified / Identity / Media Protected | **Never** | Trust only |

Seller-facing language (existing promote UI):

- Promote listing  
- Make Featured / Featured placement  
- Maximum visibility · top homepage placement  

Future copy ready: Renew Placement · Feature ends in N days.

---

## Admin controls

| Tier | Control |
|------|---------|
| Featured | Enable / disable · schedule start/end · priority (existing featured promotions + Lex Featured) |
| Trending | Automatic; admin override later |
| Recently Added | Automatic only |

---

## UX guarantees

Placement **enhances** discovery. It does **not** replace user choice.

Users must still sort / filter by Newest, Price, Most Relevant, etc. on search surfaces.

Do not change search engine internals or filter UX for v1.

---

## Future placement products (UI-flexible)

Keep components open for:

| Placement | Purpose |
|-----------|---------|
| Dealer Spotlight | Paid storefront highlight |
| Premium Collection | Paid + editorial |
| Near You | Location discovery |
| Brand Showcase | Sponsored make collections |
| Developer Spotlight | Estate developers |
| Editor’s Pick / Luxury Spotlight / Verified Choice | Editorial |
| Recommended | Personalization when data allows |
| Featured Today / Sponsored Collection | Time-boxed / curated |

Extensibility lives in `resolvePlacementKind` + rail composers — add kinds without redesigning cards.

---

## Implementation map (v1)

| Area | Change |
|------|--------|
| Docs | This file |
| Helpers | `src/lib/marketplace/placement.ts` |
| Badges | `listing-badges.ts` + `ListingBadgeRow` + card overlays |
| Home rails | Featured → Trending → Recently Added → Dealers → rest; tier dedupe |
| Discover feed | Soft-boost active Featured toward top of swipe deck |
| Seller | Existing Promote modal — placement language |

**Out of scope for v1:** new schema, new APIs, banner ads, purchasable trust.

---

## Success criteria

- Discover / home still feel elegant and curated  
- Premium placement feels earned or purchased — not intrusive  
- Trust remains non-monetizable  
- Monetization inventory exists without degrading browse quality  
