# P0 Production Incident — Homepage / Signup

**Date:** 2026-07-22  
**Status:** Diagnosed · Auth runtime fix required in Coolify · Public launch **NO-GO**  
**Repo HEAD at investigation:** `e5100f4b`+

---

## 1. Root cause

### A. Homepage “legacy” — **not a wrong deploy**

`https://yike.ng/` copy (“Find Verified Homes…”, Rent/Buy/Land, “Homes for you”) is **exactly what `main` still ships** in:

- `src/app/(public)/page.tsx`
- `src/components/home/home-mobile-hero.tsx`
- `src/components/home/home-marketplace-intro.tsx`

Sprint I–III added `/vehicles` and marketplace plumbing; they did **not** replace the property-first homepage.  
`/vehicles` and `/` share the same Coolify build (same `/_next/static` asset roots). This is **partial product surface**, not a split-container / wrong-commit issue.

### B. Signup broken — **Coolify auth runtime env**

Live probe:

```http
POST /api/auth/signup/check-duplicates → 503 {"error":"Unavailable"}
```

That path fails when either:

1. `YIKE_OTP_SERVER_TOKEN` is missing/empty in the **running container**, or  
2. `SUPABASE_SERVICE_ROLE_KEY` is missing (so `createAuthEmailOtpDbClient()` returns null)

Code: `src/app/api/auth/signup/check-duplicates/route.ts` → `createAuthEmailOtpDbClient()` in `src/lib/auth-email-otp/rpc.ts`.

DB side is healthy: `yike_internal_config.otp_server_token` exists (`value_len=64`).  
App cannot call signup RPCs until Coolify env matches that token **and** has service role for `hlpojfurfldvcxfxhveg`.

UI message “We could not start signup right now.” is the generic mapping for this 503.

---

## 2. Files changed (incident response)

| File | Change |
|------|--------|
| `src/app/api/auth/signup/ready/route.ts` | Public boolean readiness probe |
| `src/app/api/public-health/route.ts` | Exposes `diagnostics.signupReady` (no secrets) |
| `src/app/api/auth/signup/check-duplicates/route.ts` | Structured `code: auth_runtime_unavailable` + check flags |
| `src/lib/env-validation.ts` | `YIKE_OTP_SERVER_TOKEN` required in production |
| `docs/launch/ENVIRONMENT_CHECKLIST.md` | OTP token required |
| `docs/launch/P0_HOMEPAGE_SIGNUP_INCIDENT.md` | This report |

---

## 3. Runtime issue(s)

- Signup OTP + pending-profile RPCs require `YIKE_OTP_SERVER_TOKEN` + service-role admin client.
- Production container is missing one or both → every signup start returns 503.
- Health previously reported `status: ok` even when signup was dead (fixed: degraded when signup not ready).

---

## 4. Deployment issue(s)

| Finding | Assessment |
|---------|------------|
| Wrong commit for homepage | **No** — homepage source is still property-first |
| `/vehicles` new, home old | **Expected** for current `main` |
| Coolify env incomplete after platform/Coolify cutover | **Likely** — OTP token not in container |
| `commit: null` on health | Coolify not injecting `COOLIFY_SOURCE_COMMIT` / `GIT_COMMIT_SHA` (ops hygiene) |

---

## 5. Auth issue(s)

| Check | Result |
|-------|--------|
| Duplicate-check API | **503 Unavailable** |
| Email OTP feature flag | Defaults on (`ENABLE_EMAIL_OTP`) |
| DB OTP token config | Present |
| Coolify `YIKE_OTP_SERVER_TOKEN` | **Missing or mismatch** (inferred) |
| Coolify `SUPABASE_SERVICE_ROLE_KEY` | Must verify after ready probe deploys |

---

## 6. Verification steps (operator)

### Coolify (required to unblock signup)

1. Open Coolify app env for **yike.ng**.
2. Set **`YIKE_OTP_SERVER_TOKEN`** to the value in Supabase SQL Editor:

```sql
SELECT value FROM yike_internal_config WHERE key = 'otp_server_token';
```

3. Confirm **`SUPABASE_SERVICE_ROLE_KEY`** and **`NEXT_PUBLIC_SUPABASE_URL`** are for `hlpojfurfldvcxfxhveg` only.
4. Confirm **`RESEND_API_KEY`** + from-address for OTP email delivery.
5. Redeploy / restart the container (env inject).
6. Probe:

```bash
curl -sS https://yike.ng/api/auth/signup/ready | jq
curl -sS https://yike.ng/api/public-health | jq .diagnostics
```

Expect `ready: true` / `signupReady: true`.

7. Browser: complete one real signup + email OTP.

### Homepage

No deploy rollback needed for “legacy home.”  
Multi-vertical home is a **product change**, not an incident fix. Vehicles remain at `/vehicles` until an explicit homepage marketplace pass is approved.

---

## 7. GO / NO-GO

| Item | Decision |
|------|----------|
| Listings SSOT / `/vehicles` | Remain live |
| Public Vehicle launch | **NO-GO** until signup ready |
| Signup / registration | **NO-GO** until Coolify OTP + service role verified |
| Homepage redesign | Out of scope for this incident |
| Overall public launch | **⛔ NO-GO** |

---

*After Coolify env is corrected and `/api/auth/signup/ready` returns ready, re-run browser signup UAT and update this doc to PASS.*
