# Feature Freeze — Launch Mode

**Declared:** 2026-07-26  
**Status:** **ACTIVE**  
**Authority:** Founder launch direction

Yike has moved from *building features* to *operating a production marketplace*.

**Daily ops dashboard:** [LAUNCH_COMMAND_CENTER.md](./LAUNCH_COMMAND_CENTER.md) (single source of truth until launch).

Enterprise Media Protection (`704163b4`) is **production-ready**. Do not reopen feature expansion before soft launch is stable.

---

## Merge gate (only these may land)

| Priority | Allowed |
|----------|---------|
| 🔴 | Security fixes |
| 🔴 | Production bugs |
| 🔴 | Launch blockers (inventory ops, env/backups, confirmed SMS if policy requires it) |
| 🟡 | Performance improvements that do not change product surface |
| 🟡 | Documentation |

Everything else → **Version 2** milestone. Do not merge V2 work to `main` during freeze.

---

## Pre-launch focus (non-feature)

1. **Live inventory** — **vehicles primary** (Day-1 flagship); property secondary; keep `ENABLE_VEHICLE_MARKETPLACE=true` (code default ON)
2. **SMS/OTP** — separate workstream; do not merge unproven Sendchamp WIP; do not block launch if email OTP is sufficient for browse-first policy
3. **Production smoke** — guest signup · **seller vehicle upload** · buyer search/WA · agent profile · Lex moderate
4. **Environment** — Coolify env (vehicles **enabled**), backups, buckets (`property-media` public / `listing-media-archive` private), crons, alerts
5. **CI hygiene** — green lint after launch-critical path is clear (non-blocking for Coolify today)

---

## Explicitly frozen (examples)

Passport · wallet · escrow · in-app chat · AI · mortgage · registry · command center · workforce · lead billing · live Paystack boosts · intelligent watermark placement · stolen-image auto-block · new consumer dashboards · machinery vertical

**Post-launch trust investment (V2):** stolen-image detection review queue — see [STOLEN_IMAGE_DETECTION_ROADMAP.md](../media/STOLEN_IMAGE_DETECTION_ROADMAP.md).

---

## Overrides

Only the founder may lift this freeze or approve an exception in writing (chat/commit/PR note).

### Locked 2026-07-26 — product engineering STOP

Founder direction: do not add discovery rails for their own sake, AI, personalization, or V2 product surfaces without override.

**Staff exception:** Marketplace Analytics Control Tower — `/lex/auth/marketplace-analytics`.

**IA/UX exception (Phase 1):** Intelligent Marketplace progressive disclosure — buyer detail dedupe, TrustModule, stepped listing forms using existing catalogs. See [INTELLIGENT_MARKETPLACE_EXPERIENCE.md](./INTELLIGENT_MARKETPLACE_EXPERIENCE.md). No new APIs/schema. Full smart-listing intelligence remains V2.

**Governance (permanent, docs/rules):** Intelligent Marketplace OS + Yike Design System (YDS) — [INTELLIGENT_MARKETPLACE.md](../product/INTELLIGENT_MARKETPLACE.md), [YIKE_DESIGN_SYSTEM.md](../design/YIKE_DESIGN_SYSTEM.md). Documentation and token alignment may land during freeze; V2 automation (LLM, comps, factory catalogs) stays deferred.

Further launch work = dealers, inventory, FAT, media smoke, support, bugfixes.
