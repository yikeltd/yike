# Production Runtime Verification Report

**Date:** 2026-07-22  
**Commit:** `669eb789bcde4b48b98f6db99b5a47f9f095a457`  
**Do NOT commit** (review-only)

---

## 1. Runtime Configuration Report

### Build output vs expectation

| Expected artifact | In commit `669eb789` | Live on yike.ng |
|-------------------|----------------------|-----------------|
| `/api/auth/signup/ready` | Yes | Yes (503 body with checks) |
| `diagnostics.signupReady` on `/api/public-health` | Yes | Yes (`false`) |
| “New marketplace homepage” on `/` | **No — not in this commit** | N/A |
| Property-first home hero | Yes (`Find Verified Homes…`) | Yes |
| `/vehicles` marketplace UI | Yes | Yes |

**Conclusion:** Production is running the expected build. Behaviour mismatch is **runtime env**, not a missing homepage from this commit.

### Live diagnostics (at verification time)

```json
{
  "status": "degraded",
  "diagnostics": {
    "signupReady": false,
    "emailOtpEnabled": true,
    "yikeOtpServerToken": false,
    "supabaseServiceRole": false,
    "otpDbClient": false
  }
}
```

`/api/auth/signup/ready` reports the same flags plus `supabaseUrl: false`, `resendConfigured: false`, `siteUrlConfigured: false`.

---

## 2. Environment Variable Checklist

### Must be set in Coolify for signupReady=true

| Variable | Source | Prepared locally |
|----------|--------|------------------|
| `YIKE_OTP_SERVER_TOKEN` | DB `yike_internal_config.otp_server_token` | Yes → `/tmp/yike-ops/coolify-signup-env.json` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project API keys (service_role) | Yes (same file) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://hlpojfurfldvcxfxhveg.supabase.co` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Yes |
| `NEXT_PUBLIC_SITE_URL` | `https://yike.ng` | Yes |

### Also required / strongly recommended (still verify in Coolify)

| Variable | Why |
|----------|-----|
| `CRON_SECRET` | Required by env-validation; cron/health auth |
| `RESEND_API_KEY` | OTP email delivery (`resendConfigured` currently false) |
| `APP_ENV=production` | Production posture |
| `ENABLE_EMAIL_OTP=true` | Already effectively on (default) |
| `GIT_COMMIT_SHA` / `COOLIFY_SOURCE_COMMIT` | Health commit visibility (`commit: null` now) |
| `SENDCHAMP_WEBHOOK_SECRET` | Webhook fail-closed |
| `RESEND_FROM_EMAIL` / transactional from | Must be allowed sender |

### Coolify apply status (this session)

| Action | Status |
|--------|--------|
| Retrieve OTP + service role securely | **Done** (temp file mode 0600) |
| Write into Coolify UI/API | **Blocked** — no `COOLIFY_TOKEN` / `COOLIFY_API_TOKEN` in agent env; browser automation MCP unavailable |
| Open Coolify control plane | Opened `https://control.stankings.com` |

Helper (not committed unless you approve later): `scripts/apply-coolify-signup-env.sh`  
Requires `COOLIFY_TOKEN` + `COOLIFY_APP_UUID`.

---

## 3. Startup Behaviour Report

From `src/lib/env-validation.ts` + signup clients:

| Condition | Behaviour |
|-----------|-----------|
| OTP token missing | `createAuthEmailOtpDbClient()` → `null`; signup/check-duplicates → **503**; health `signupReady: false`; container **still boots** |
| Service role missing | Same as above (`otpDbClient` false); admin RPCs unavailable |
| `ENABLE_EMAIL_OTP=false` | Signup returns “Email sign-up is temporarily unavailable” (503) |
| Feature flags for homepage | **None** disable “Find Verified Homes…” — copy is hardcoded |
| Marketplace homepage flag | **No flag** — `/` is property-first by design; vehicles on `/vehicles` |

Startup logs missing required vars but **does not crash** the process (intentional so diagnostics remain reachable).

---

## 4. Health Endpoint Report

| Endpoint | Expected | Observed |
|----------|----------|----------|
| `GET /api/public-health` | JSON with `diagnostics.signupReady` | **PASS** — present, `false` |
| `GET /api/auth/signup/ready` | `{ ready, checks, hint }` | **PASS** — `ready:false`, checks populated |
| Signup start (`check-duplicates`) | 200 when ready | **FAIL** — 503 `auth_runtime_unavailable` until Coolify env set |

After Coolify restart with secrets, expect:

- `signupReady: true`
- `ready: true` on `/api/auth/signup/ready`
- HTTP 200 from readiness endpoint

---

## 5. Root Cause Analysis

1. **Deploy:** Correct (`669eb789` live).  
2. **Homepage:** Not missing from build — commit never shipped a marketplace home hero.  
3. **Signup:** Coolify runtime lacks `YIKE_OTP_SERVER_TOKEN` and `SUPABASE_SERVICE_ROLE_KEY` (and related public URL/site/resend flags also false at runtime).  
4. **Why agent couldn’t auto-fill Coolify:** No Coolify API token in environment; Cursor browser MCP not available this session.

---

## 6. GO / NO-GO

| Scope | Decision |
|-------|----------|
| Build / deploy of `669eb789` | **GO** |
| Signup | **NO-GO** until Coolify env applied + restart + readiness true |
| Public Vehicle launch | **NO-GO** |
| Overall | **⛔ NO-GO** |

### Immediate operator steps

1. In Coolify → Yike app → Environment, paste values from `/tmp/yike-ops/coolify-signup-env.json` for at least:
   - `YIKE_OTP_SERVER_TOKEN`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL`
2. Confirm `RESEND_API_KEY` + `CRON_SECRET` still set.
3. Restart application.
4. `curl -sS https://yike.ng/api/auth/signup/ready`
5. Or provide `COOLIFY_TOKEN` + `COOLIFY_APP_UUID` and re-run `scripts/apply-coolify-signup-env.sh`.

---

*No repository commit created.*
