# Yike Core Product Philosophy — The Intelligent Marketplace

**Status:** Permanent operating system (not a one-off redesign)  
**Companion:** [Yike Design System (YDS)](../design/YIKE_DESIGN_SYSTEM.md) · Phase 1 ship notes [INTELLIGENT_MARKETPLACE_EXPERIENCE.md](../launch/INTELLIGENT_MARKETPLACE_EXPERIENCE.md) · Listing architecture [INTELLIGENT_LISTING_ENGINE.md](../launch/INTELLIGENT_LISTING_ENGINE.md)  
**Cursor rules:** `.cursor/rules/intelligent-marketplace.mdc` · `.cursor/rules/yike-design-system.mdc`

---

## Vision

Yike should become Nigeria’s smartest marketplace.

The platform should **reduce work**, not create work. Users should feel an intelligent assistant helping them buy and sell—not another form-heavy classifieds site.

Every interaction answers:

> **Can the platform do this automatically?**

If yes — the platform should do it.

> **How can Yike do this for the user instead of asking the user to do it?**

That is the difference between software and a premium platform.

---

## The golden rule

1. Never ask for information the platform already knows.  
2. Never ask for information the platform can confidently determine.  
3. Never ask the user to repeat information.  
4. Never display the same fact twice.  

**The platform thinks first. The user thinks second.**

---

## Merge gate (every screen, forever)

Before any UI or workflow lands:

| # | Question |
|---|----------|
| 1 | Can the platform fill this automatically? |
| 2 | Can this section be shorter? |
| 3 | Can this information appear only once? |
| 4 | Can advanced details stay hidden until needed? |
| 5 | Can this become one click instead of three? |
| 6 | Can the user complete this faster? |
| 7 | Does this increase trust? |
| 8 | Does this reduce cognitive load? |

If any answer is **no** → redesign before merge.

---

## Intelligent buyer experience

Guided journey — never overwhelm:

1. Gallery  
2. Price  
3. Trust (one TrustModule)  
4. Quick summary  
5. Primary CTA  
6. Expandable details  
7. Dealer (once)  
8. Related listings  
9. Safety resources (bottom only)

Answer before they ask (only with **real** data): verified seller, media protected, posted age, listing completeness. Never invent fair-price scores, response rates, or ratings.

---

## Intelligent seller experience

Listing feels like a conversation, not a giant form:

Category → make → models → year → system suggests title / fields / category → seller **reviews**, does not invent from blank.

**Phase 1 (shipped):** stepped forms, make→model catalogs, editable auto-title, type-based property fields, advanced collapsed.  
**Architecture (locked):** one metadata-driven [Intelligent Listing Engine](../launch/INTELLIGENT_LISTING_ENGINE.md) — Vehicle + Property (+ future verticals) from category manifests, not duplicate wizards.  
**V2:** factory trim/HP catalogs, LLM description drafts, live market price bands — see [V2_BACKLOG.md](../launch/V2_BACKLOG.md).

---

## Intelligent photo experience

Uploads trigger automation (reuse `src/lib/media/` + ListingPhotoManager):

Compress · WebP · responsive sizes · strip metadata · watermark · thumbnails · progress.

**V2:** quality ranking, blur/dark/duplicate vision beyond current pipeline, missing-angle recommendations.

---

## Intelligent title & description

Never start with empty title. Suggest from known facts; seller edits.

Description assist = V2 (honest LLM product surface)—do not fake long-form copy with invented features.

---

## Intelligent property / location / pricing / search

| Capability | Now | Later |
|------------|-----|-------|
| Type-adaptive property fields | Phase 1 | — |
| Progressive search filters | Phase 1 | — |
| Cascading LGAs / landmarks / keywords | Partial catalogs | Enrich V2 |
| Market price ranges from comps | — | V2 when honest |
| Typeahead intent (Toy → Toyota…) | Soft where data exists | V2 polish |

---

## Intelligent dealer experience

Action-focused, not dashboard clutter: leads, inventory health, missing photos, drafts, approval—**only surfaces that exist**. No invented metrics.

---

## Intelligent trust

One Trust Card / TrustModule: chips + Learn more. Not repeated safety walls mid-page.

---

## Intelligent empty states & performance

No dead ends: nearby cities, similar categories, popular searches, verified dealers, budget alternatives when inventory is empty.

Lazy images, on-demand specs, cache suggestions, prefetch where cheap—**never sacrifice speed**.

---

## Intelligent design

The UI should disappear. Users remember cars, houses, dealers, and confidence—not chrome.

Visual language and component rules: **[YIKE_DESIGN_SYSTEM.md](../design/YIKE_DESIGN_SYSTEM.md)**.

---

## Honesty constraint (non-negotiable)

Intelligence without lying. Prefer “unknown / not shown” over fabricated:

- Response rate / ratings / deal counts  
- Fair market price badges without comps  
- “AI verified” claims without a real check  

---

## Final objective

Yike is known for one promise:

> **The easiest and smartest place in Nigeria to buy or sell a vehicle or property.**

Every feature, component, screen, and interaction reinforces that promise.
