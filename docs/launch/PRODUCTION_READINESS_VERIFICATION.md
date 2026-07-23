# Production Readiness Verification Report

**Date:** 2026-07-23  
**Environment:** https://yike.ng (Coolify / Hetzner)  
**Supabase:** `hlpojfurfldvcxfxhveg`  
**Branch:** `main` (local hardening uncommitted — do not ship until review)  
**Verdict:** **CONDITIONAL GO** — auth/env restored; fix open-redirect + headers before public push; seed approved listings for marketplace launch.

---

## 1. Environment Verification

| Check | Result |
|-------|--------|
| `GET /api/auth/signup/ready` | `ready: true` (all checks true) |
| `GET /api/public-health` | `status: ok`, `signupReady: true` |
| Supabase URL / service role / OTP token / Resend / site URL | Present at runtime |
| Sendchamp webhook secret | Present (POST without secret → **401**, not 503) |
| Cron without secret | **401** |
| Paystack | Not configured → was soft-acking `200 skipped` (hardened locally to **503**) |
| `GIT_COMMIT_SHA` / `buildTime` | Still `null` in public-health (ops gap) |
| Client secret leakage | No `NEXT_PUBLIC_*` service-role usage found |

**Local CLI link:** `npm run verify:supabase-project -- --require-linked` → **PASS** (`hlpojfurfldvcxfxhveg`).

---

## 2. Authentication Report

| Flow | Status |
|------|--------|
| Signup readiness | **PASS** (env restored) |
| Invalid signup payload | Validation error (not 503) |
| `/agent` anonymous | Redirects to `/auth/login?next=/agent` |
| `/api/admin/env-health` | **401** unauthenticated |
| `/lex` | StaffSessionGuard (client) + staff APIs gated; shell HTML may load |
| Auth callback `next` param | **FAIL (Critical)** — open redirect / bad origin; **fixed locally** via `safeNextPath` + `SITE_URL` |
| Password reset / email verify | Code paths present; live OTP email not end-to-end exercised in this pass |

---

## 3. Database Health Report

| Item | Result |
|------|--------|
| Migrations local ↔ remote | Synced through `20260722180232` (listings SSOT) |
| `listings` | **VIEW**, `security_invoker=true` |
| `properties` RLS | **ON**, 4 policies |
| Storage buckets | `property-media`/`profile-images`/`ad-creatives` public; docs buckets private |
| Listing inventory | **0 approved**; 5 rejected, 3 hidden, 1 archived, 1 pending; 9 PROPERTY + 1 VEHICLE |

---

## 4. Storage Verification Report

| Item | Status |
|------|--------|
| Upload API auth + role gate | Present (`/api/media/upload`) |
| Image type allowlist + compress | Present |
| Video validation | Present |
| Live upload smoke | Not run (requires agent session) |

---

## 5. Paystack Verification Report

| Item | Status |
|------|--------|
| HMAC signature (`x-paystack-signature`) | Implemented |
| Duplicate event table | Implemented |
| Production configured | **No** (`200 skipped` observed) |
| Hardening | Local change: unconfigured / no admin → **503**; no error message leak |

Payments remain launch-flag gated; marketplace can launch without Paystack if featured payments stay off.

---

## 6. SendChamp Verification Report

| Item | Status |
|------|--------|
| Webhook GET health | **200** |
| Webhook POST no/wrong secret | **401** (secret set, fail-closed) |
| SMS sender `YIKE` + channel `sms` | Local code defaults updated (not yet deployed) |
| Live SMS OTP end-to-end | Dashboard test succeeded earlier; app path needs Coolify `SENDCHAMP_*` + phone flags |

---

## 7. Cron Jobs

All routes under `/api/cron/*` require `CRON_SECRET` (Bearer or `x-cron-secret`). Missing secret → **401**. Live unauthorized probe confirmed for `listing-operations`.

---

## 8. Security Review

### Critical (remediated locally — deploy required)

1. **Open redirect / wrong origin in `/auth/callback`** — `next=//…` accepted; request `origin` could be `localhost` behind proxy. Fixed with `safeNextPath` + canonical site URL.

### High

2. **Missing baseline security headers** — no CSP/XFO/HSTS previously. Local `next.config.ts` now adds X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, HSTS. (Full CSP deferred — needs careful allowlist for Supabase/images.)

3. **Zero approved public listings** — marketplace empty for consumers.

### Medium

4. Public signup readiness / health recon endpoints (booleans only; hint softened).
5. Sendchamp webhook query-param secret (prefer header to avoid access-log leakage).
6. Deploy metadata (`GIT_COMMIT_SHA`) unset.

### Low

7. Staff `/lex` gate is primarily client + API RBAC (acceptable if APIs stay locked).

---

## 9. Performance Review (spot)

- `next/image`, media pipeline, App Router present.
- Homepage still property-first (product choice, not incident).
- No deep bundle audit in this pass.
- Public pages `/`, `/vehicles`, `/search`, `/auth/*` return **200**.

---

## 10. End-to-End Flow Validation

| Persona / flow | Result |
|----------------|--------|
| Anonymous browse | Pages load; **no approved listings** to contact |
| Signup API dependency | Ready |
| Full signup → email OTP → login | Not fully executed (needs real inbox) |
| Agent dashboard | Auth redirect works |
| Admin `/lex` APIs | 401 without session |
| Moderator | Not live-session tested |

---

## 11. Prioritized Remediation

| Priority | Item | Owner |
|----------|------|-------|
| Critical | Deploy auth callback + webhook + header hardening | Eng (after review/commit) |
| High | Approve / seed real listings for launch cities | Ops / moderation |
| High | Confirm Coolify Sendchamp SMS env + webhook header secret | Ops |
| Medium | Set `GIT_COMMIT_SHA` / `BUILD_TIME` in Coolify build | Ops |
| Medium | Optional: gate `/api/auth/signup/ready` behind cron secret | Eng |
| Medium | Full CSP allowlist pass | Eng (post-launch OK) |
| Low | Live Paystack when featured payments enabled | Eng |

---

## 12. Launch Recommendation

**CONDITIONAL GO for auth infrastructure.**  
**NO-GO for full marketplace launch** until:

1. Hardening commit is reviewed, committed, and deployed.
2. At least a minimum set of **approved** listings is live.
3. Optional: SMS phone OTP smoke if phone auth is in launch scope (email-first is OK).

Do **not** commit until architectural review of the local hardening diff.
