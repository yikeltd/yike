# Founder Executive Brief — 2026-07-26

**Phase:** Launch Operations · Feature Freeze ACTIVE  
**Command Center:** [LAUNCH_COMMAND_CENTER.md](./LAUNCH_COMMAND_CENTER.md)  
**Ops audit:** [LAUNCH_OPS_AUDIT_2026-07-26.md](./LAUNCH_OPS_AUDIT_2026-07-26.md)

---

## 1. What changed?

Engineering closed launch-safe items only:

- CI blockers: `prefer-const` + React “refs during render” in phone-verify UI
- Added `global-error.tsx` (minimum crash UI until real monitoring)
- Production probes: legal pages, search, signup, media API auth gate
- Live inventory counted from prod DB
- Command Center updated with real metrics and classifications

Media Protection, auth architecture, and V2 roadmap were **not** modified.

---

## 2. What remains?

| Bucket | Items |
|--------|-------|
| **Founder** | Live supply (32 vs 250+); leaked-password ON; secret rotation check; Coolify `ENABLE_VEHICLE_MARKETPLACE=false`; 2–3h FAT; one live photo → confirm watermark + `media_assets` row |
| **Engineering** | Optional: wire Sentry; continue CI warning cleanup (non-blocking); empty-state honesty if soft-launching thin inventory |
| **Ops** | Backup restore drill; Lex env-health walkthrough; daily Coolify checklist |
| **Business** | Agent/agency recruitment; city coverage plan; soft-launch framing |
| **Legal** | Confirm live legal pages match counsel-approved text (pages resolve 200) |
| **Marketing** | Social, press kit, Play assets — after inventory |

---

## 3. What can I personally complete?

1. **Inventory** — approve/recruit until market doesn’t feel empty (or declare soft-launch cities + honest empty states).  
2. **Supabase Auth** — enable leaked-password protection ([FOUNDER_ACTION_LEAKED_PASSWORD_PROTECTION.md](./FOUNDER_ACTION_LEAKED_PASSWORD_PROTECTION.md)).  
3. **Coolify** — set `ENABLE_VEHICLE_MARKETPLACE=false` until vehicle supply exists.  
4. **Secrets** — confirm OTP server token / Sendchamp keys rotated if ever exposed.  
5. **FAT (2–3 hours)** — buyer, seller, agent, admin scripts; log blockers vs post-launch.  
6. **One listing photo** — prove media protection on production (`media_assets` currently **0**).

---

## 4. What is blocking launch?

**Critical / High (must clear for GO):**

1. **Supply** — 32 approved live listings (target 250+); only 3 verified-ish agents  
2. **Founder Auth setting** — leaked-password still disabled  
3. **FAT unsigned** — no founder-signed E2E  
4. **Media protection live smoke** — zero `media_assets` rows yet  

**Not blockers (deferred / gated):** SMS OTP WIP · vehicles inventory · Paystack featured · Sentry · full CI green

---

## 5. What percentage complete is Yike today?

| Lens | Estimate |
|------|----------|
| Feature completeness (property discovery) | **~92%** |
| Platform / eng launch-safe | **~88%** |
| **Overall launch readiness (ops + supply)** | **~72%** |

Delta to GO is almost entirely **operations + inventory + founder sign-off**, not missing product features.

---

## 6. If you were CTO, would you authorize launch today?

**No — Conditional NO-GO.**

Why: the product and security baseline are strong enough for a soft launch *after* inventory and founder controls, but shipping a “trusted marketplace” claim with ~32 listings, unverified media-protection smoke on prod uploads, and open Auth leaked-password setting would burn trust.

**Authorize soft launch when:**

- Honest city framing **or** ≥ meaningful local supply  
- C07/C08 done or explicitly accepted in writing  
- FAT green on Critical paths  
- ≥1 production upload visible in Lex Uploads & Protection  

**Confidence:** High that eng is not the bottleneck; Medium on timeline (depends on founder supply velocity).

---

## Estimated hours remaining

| Workstream | Hours |
|------------|------:|
| Founder FAT + media smoke | 3–4 |
| C07/C08 / Coolify flags | 1–2 |
| Ops backup drill + env-health | 2–3 |
| Supply to soft-launch credible | 40–120+ (business, not eng) |
| Eng optional (Sentry, CI warnings) | 4–12 |
| **Eng critical remaining** | **~0–4** |

---

## Recommendation

Keep **NO-GO** on the Command Center. Stay in feature freeze. Run FAT next. Push inventory hardest.
