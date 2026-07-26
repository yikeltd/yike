# Launch War Room — 2026-07-26

**Source audit:** [LAUNCH_READINESS_AUDIT_2026-07-26.md](./LAUNCH_READINESS_AUDIT_2026-07-26.md)  
**DB verify:** [PROD_DB_SECURITY_VERIFY_2026-07-26.md](./PROD_DB_SECURITY_VERIFY_2026-07-26.md)  
**Rule:** Work top-down. No Version-2 features until Critical is green.

Status legend: `OPEN` · `IN_PROGRESS` · `DONE` · `FOUNDER` · `DEFERRED`

---

## Critical (must fix before public launch)

| ID | Task | Owner | Status | Notes |
|----|------|-------|--------|-------|
| C01 | Confirm Jul 24–26 security migrations applied on `hlpojfurfldvcxfxhveg` + re-run DB advisors | Eng + Founder | DONE | Migrations on remote; advisors WARN only = leaked-password (C08) |
| C02 | Lock profiles: clients cannot UPDATE `role`, `is_banned`, verification/staff fields | Eng | DONE | Migration `20260726100534_…` **applied on prod** |
| C03 | Media upload: ownership check + UUID path + size gate before buffer | Eng | DONE | `src/app/api/media/upload/route.ts` |
| C04 | Live supply: real approved listings in launch cities (Aba/Enugu/Owerri or chosen set) | Founder | FOUNDER | Or honest soft-launch framing with empty states |
| C05 | Seller SMS: prove handset delivery **or** defer phone-verify as launch requirement | Founder + Eng | DEFERRED | Browse-first already; phone not required for signup. OTP WIP stays uncommitted until proven. |
| C06 | Vehicles posture: OFF until supply **or** ON with inventory | Eng | DONE | Default OFF; sitemap gated; `KNOWN_LIMITATIONS` updated |
| C07 | Rotate OTP server token if still migration-seeded; rotate Sendchamp if exposed | Founder | FOUNDER | Coolify + Auth dashboard |
| C08 | Enable Supabase Auth leaked-password protection | Founder | FOUNDER | Confirmed disabled by advisors |
| C09 | CI lint P0: fix `/lex/tech/webhooks` Link + stop normalizing red `main` | Eng | DONE | `<a>` → `next/link` Link |

---

## Polish (launch quality)

| ID | Task | Owner | Status |
|----|------|-------|--------|
| P01 | Align bottom nav with locked IA (or update product rule deliberately) | Eng | OPEN |
| P02 | Collapse Discover/Browse/Swipe naming confusion | Eng | OPEN |
| P03 | Empty / loading / error states when inventory is zero (no misleading fixtures) | Eng | OPEN |
| P04 | Code-split `listing-form` / photo manager hot path | Eng | OPEN |
| P05 | Auth + search a11y pass (labels, focus-visible) | Eng | OPEN |
| P06 | Sitemap honesty for thin hubs (`/hotel`, `/shortlet`, vehicles) | Eng | OPEN |
| P07 | Support moderation runbook: use `/lex/auth` as primary | Ops | OPEN |
| P08 | `global-error.tsx` + crash monitoring (Sentry or equivalent) | Eng | OPEN |
| P09 | Dual seller verify paths → one clear flow | Eng | OPEN |
| P10 | Dashboard trust copy / Basic Verified upgrade CTA clarity | Eng | OPEN |

---

## Version 2 (do not build now)

| ID | Item |
|----|------|
| V01 | Passport UI |
| V02 | Wallet |
| V03 | Escrow |
| V04 | In-app chat |
| V05 | AI features |
| V06 | Mortgage / insurance UI |
| V07 | National registry |
| V08 | Command center (consumer) |
| V09 | Workforce (consumer) |
| V10 | Developer API surface |
| V11 | Industrial / auctions / electronics |
| V12 | Machinery vertical |
| V13 | Home services marketplace |
| V14 | Lead billing |
| V15 | Live subscriptions checkout |
| V16 | WhatsApp OTP |
| V17 | Direct agent WA/calls (until trust model revisited) |
| V18 | Deep social graph |
| V19 | Live Paystack featured boosts (only when intentional) |

---

## Phase checklist

### Phase 1 — Critical
- [x] C01–C03, C06, C09 engineering closed
- [x] C02 migration applied on production (`supabase db push` 2026-07-26)
- [ ] C04, C07, C08 founder actions closed or explicitly accepted risk
- [x] C05 deferred with written decision (this doc)

### Phase 2 — Polish
- [ ] P01–P10 as capacity allows; prioritize P03, P08, P06 before hard marketing

### Phase 3 — Launch smoke
- [ ] Coolify Ready on release commit
- [ ] Signup/login · search · WA inquiry · save · upload · mobile · SEO sample · PWA · Lex pending queue · one seller list E2E

### Phase 4 — V2
- [ ] Only after soft launch stable ≥2 weeks

---

## Decision log

| Date | Decision |
|------|----------|
| 2026-07-26 | Audit approved for execution; stop feature creep |
| 2026-07-26 | **SMS:** Defer proving delivery as launch blocker; phone verification remains non-required for browse/signup. Do not merge unproven OTP WIP to `main`. |
| 2026-07-26 | **Vehicles:** Prefer default **OFF** until real vehicle supply exists (align code + docs). |
| 2026-07-26 | **C01:** Security migrations confirmed on prod via `db:status`; advisors clean except leaked-password. |
| 2026-07-26 | **Media protection:** Declared production-ready; shipped `704163b4`. |
| 2026-07-26 | **Feature freeze ACTIVE** — see [FEATURE_FREEZE.md](./FEATURE_FREEZE.md). Only security / prod bugs / launch blockers / perf / docs. |

---

## Progress notes

- 2026-07-26 — Audit + War Room docs written.
- 2026-07-26 — C01 verified (`PROD_DB_SECURITY_VERIFY_2026-07-26.md`).
- 2026-07-26 — Eng Phase 1: profile privileged-column trigger migration (**applied**), media upload ownership/size/UUID, vehicles default OFF + sitemap gate, webhooks Link lint fix.
