# Feature Freeze — Launch Mode

**Declared:** 2026-07-26  
**Status:** **ACTIVE**  
**Authority:** Founder launch direction

Yike has moved from *building features* to *operating a production marketplace*.

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

1. **Live inventory** — real property listings; vehicles only if supply + `ENABLE_VEHICLE_MARKETPLACE=true`
2. **SMS/OTP** — separate workstream; do not merge unproven Sendchamp WIP; do not block launch if email OTP is sufficient for browse-first policy
3. **Production smoke** — guest signup · seller upload · buyer search/WA · agent profile · Lex moderate
4. **Environment** — Coolify env, backups, buckets (`property-media` public / `listing-media-archive` private), crons, alerts
5. **CI hygiene** — green lint after launch-critical path is clear (non-blocking for Coolify today)

---

## Explicitly frozen (examples)

Passport · wallet · escrow · in-app chat · AI · mortgage · registry · command center · workforce · lead billing · live Paystack boosts · intelligent watermark placement · stolen-image auto-block · new consumer dashboards · machinery vertical

**Post-launch trust investment (V2):** stolen-image detection review queue — see [STOLEN_IMAGE_DETECTION_ROADMAP.md](../media/STOLEN_IMAGE_DETECTION_ROADMAP.md).

---

## Overrides

Only the founder may lift this freeze or approve an exception in writing (chat/commit/PR note).
