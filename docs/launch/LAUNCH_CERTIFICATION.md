# Launch Certification — Production Hardening Pass

**Date:** 2026-07-23  
**Repo:** yikeltd/yike · branch `main` (local hardening **uncommitted**)  
**Supabase:** `hlpojfurfldvcxfxhveg`  
**Live site:** https://yike.ng  

## Launch Decision

# READY AFTER DEPLOYMENT VERIFICATION

Marketplace consumer launch remains **operationally blocked** until approved inventory > 0.

---

## 1. Security Hardening Validation (local code)

| Control | Status | Evidence |
|---------|--------|----------|
| Auth callback `safeNextPath` | **PASS (local)** | Blocks `//`, absolute URLs, encoded `/%2f%2f…`, schemes |
| Canonical redirect origin | **PASS (local)** | Only `yike.ng` / `www` / `localhost`; else `SITE_URL` |
| Login / verify-email / signup / profile-setup `next` | **PASS (local)** | All use `safeNextPath` |
| CSP | **PASS (local)** | Added in `next.config.ts` |
| X-Frame-Options DENY | **PASS (local)** | `next.config.ts` |
| X-Content-Type-Options | **PASS (local)** | nosniff |
| Referrer-Policy | **PASS (local)** | strict-origin-when-cross-origin |
| Permissions-Policy | **PASS (local)** | camera/mic/geo/payment disabled |
| HSTS | **PASS (local)** | max-age=63072000; includeSubDomains; preload |
| Deployed headers on yike.ng | **FAIL (not deployed)** | Live response lacks security headers |

---

## 2. Authentication Validation

| Check | Live | Local |
|-------|------|-------|
| Signup readiness | `ready: true` | — |
| Open redirect on `/auth/callback` | Vulnerable until deploy | Fixed |
| Client `next` bypass (login/verify) | Vulnerable until deploy | Fixed |
| `/agent` anonymous | Redirects to login | — |
| Admin APIs anonymous | 401 | — |

Unit attack matrix for `safeNextPath`: **ALL PASS** (incl. encoded protocol-relative).

---

## 3. Paystack Validation

| Check | Live today | Local hardening |
|-------|------------|-----------------|
| Unconfigured POST | **200** soft-ack (`skipped`) | **503** fail-closed |
| Signature HMAC-SHA512 + timingSafeEqual | Present in provider | Unchanged |
| Duplicate event protection | Present | Unchanged |
| Missing admin client | Soft-ack historically | **503** |

Payments can stay offline for marketplace launch; fail-closed must deploy before enabling Paystack.

---

## 4. SendChamp Validation

| Check | Live | Local |
|-------|------|-------|
| Missing/wrong secret POST | **401** | Same + timing-safe compare |
| Missing secret env | Fail-closed 503 | Same |
| Unauthenticated data mutation | Blocked (no handler without auth) | Same |
| Replay protection | Delivery status logs only (no OTP mint) | Acceptable for launch |
| SMS sender `YIKE` defaults | Code local | Needs deploy if phone OTP enabled |

---

## 5. Marketplace Inventory Status (read-only)

| Status | Count | Notes |
|--------|------:|-------|
| **approved** | **0** | **Launch blocker (ops)** |
| pending | 1 | VEHICLE |
| hidden | 3 | PROPERTY |
| archived | 1 | PROPERTY |
| rejected | 5 | PROPERTY |

**Total rows:** 10 · **PROPERTY:** 9 · **VEHICLE:** 1  

No production inventory was modified.

---

## 6. Production Smoke Test

| Journey | Status |
|---------|--------|
| Signup env / OTP plumbing | Ready (env) — full OTP inbox E2E not re-run this pass |
| Login / logout / search / profile | Pages load; full session E2E deferred until after deploy |
| Listing details / contact seller / saved | **Blocked by 0 approved listings** |
| Admin / moderator login | Deferred to post-deploy staff session check |

**Post-deploy required smoke (your sequence steps 4–6):**  
Auth callback attack URL · response headers · Paystack 503 · Sendchamp 401 · then seed/approve listings · full user journeys.

---

## 7. Final Production Readiness

### Technically ready after deploy
- Env restored
- DB / RLS / migrations healthy
- Cron protected
- SendChamp webhook secret live
- Local hardening complete for approved blockers

### Still blocking full launch
1. **Deploy** hardening commit (after your approve)
2. **Verify** headers + callback + Paystack 503 on live
3. **Approve/seed listings** (ops — not a code defect)

---

## Classification

**READY AFTER DEPLOYMENT VERIFICATION**

Not **READY FOR PRODUCTION** until deploy verification succeeds **and** approved listings > 0.  
Not **BLOCKED** on engineering foundation — ops + undeployed hardening remain.

---

## Commit gate

**Do not commit until you explicitly approve.**  
When approved, commit scope should be hardening-only:

- `src/lib/auth/safe-next-path.ts`
- `src/app/auth/callback/route.ts`
- `src/app/auth/login/login-client.tsx`
- `src/app/auth/verify-email/page.tsx`
- `src/app/auth/signup/page.tsx`
- `src/app/agent/profile-setup/page.tsx`
- `next.config.ts` (security headers + CSP)
- `src/app/api/webhooks/paystack/route.ts`
- `src/app/api/webhooks/sendchamp/route.ts`
- Sendchamp SMS sender defaults (if included)
- This certification doc (optional)
