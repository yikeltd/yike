# Production Recovery Report — P0 Signup & Deployment Verification

**Date:** 2026-07-22  
**Branch:** `main` @ `669eb789`  
**Supabase:** `hlpojfurfldvcxfxhveg`  
**Commit status:** **Do NOT commit** (review-only audit)  
**Public launch:** **NO-GO**

---

## 1. Root Cause Report

### Corrected understanding

| Earlier assumption | Actual finding |
|--------------------|----------------|
| Production is not serving `669eb789` | **FALSE** — production **is** serving `669eb789` |
| Homepage is a wrong/old container | **FALSE** — homepage matches current `main` source |
| Signup broken because deploy lagged | **PARTIAL** — fix is live; **Coolify runtime env is empty** |

### Primary root cause (signup P0)

Coolify production container runtime environment is missing critical secrets. Live diagnostics from the **new** endpoints:

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

`/api/auth/signup/ready` → **503** with the same flags.  
`/api/auth/signup/check-duplicates` → **503** `code: auth_runtime_unavailable`.

So:

1. Code for readiness **did deploy**.
2. Signup still fails because `YIKE_OTP_SERVER_TOKEN` and `SUPABASE_SERVICE_ROLE_KEY` (and runtime `NEXT_PUBLIC_SUPABASE_URL`) are **not present in the running process**.
3. Client/page data can still appear to work if `NEXT_PUBLIC_*` were **baked at Docker build time**, while server-only secrets (OTP token, service role) only exist at runtime — and are currently missing.

### Secondary clarification (homepage)

Production homepage still shows **“Find Verified Homes Across Nigeria”** because that string is still the intentional hero copy in:

- `src/components/home/home-mobile-hero.tsx`
- `src/components/home/home-marketplace-intro.tsx`

There is **no** `MarketplaceVerticalSwitcher` on `src/app/(public)/page.tsx`.  
Marketplace multi-vertical UI lives on `/vehicles` and `/search`, not the home hero. This is a **product surface choice**, not a deployment mismatch.

---

## 2. Deployment Audit Report

| Check | Result |
|-------|--------|
| Local `main` SHA | `669eb789bcde4b48b98f6db99b5a47f9f095a457` |
| `origin/main` | Same (synced) |
| GitHub Production deployment | Created `2026-07-22T22:32:48Z` for `669eb789` |
| Prod `/api/public-health` | Includes `diagnostics.signupReady` → **build includes 669eb789** |
| Prod `/api/auth/signup/ready` | Exists, returns structured JSON → **route is live** |
| Prod commit metadata | `commit: null` — Coolify not injecting `COOLIFY_SOURCE_COMMIT` / `GIT_COMMIT_SHA` |
| Dockerfile | `npm ci` → `npm run build` → `npm start` (no commit SHA bake) |
| Issue class | **Runtime configuration** (not branch mismatch, not stale homepage build) |

### Classification

| Hypothesis | Verdict |
|------------|---------|
| Build failed / wrong artifact | Rejected — new routes live |
| Wrong branch | Rejected — GitHub Production deployment = `669eb789` |
| Cache serving old API | Rejected — new diagnostics shape present |
| Runtime configuration | **Confirmed** — OTP + service role + URL flags false |

---

## 3. Homepage Verification Report

| Item | Finding |
|------|---------|
| Route | `src/app/(public)/page.tsx` |
| Hero title | “Find Verified Homes Across Nigeria” (source) |
| Feed heading | “Homes for you” (source) |
| Vertical switcher on home | **Absent** (`homeHasSwitcher: false`) |
| Vehicles page | Has switcher + “Yike Marketplace” + “Sell a vehicle” |
| Feature flags affecting home copy | None found for this hero string |
| Middleware rewriting `/` | No evidence of legacy rewrite |
| Exact cause | **Current main intentionally ships property-first homepage** |

Expecting a “Marketplace homepage” on `/` requires a **product change**, not a redeploy.

---

## 4. Signup Readiness Report (local / codebase)

### Code presence — PASS

| Artifact | Status |
|----------|--------|
| `src/app/api/auth/signup/ready/route.ts` | Exists, exports `GET` |
| `diagnostics.signupReady` on public-health | Present |
| `YIKE_OTP_SERVER_TOKEN` in `env-validation` required list | Present |
| `createAuthEmailOtpDbClient` requires token + admin client | Confirmed |

### Logic matrix (local simulation) — PASS

| Case | ready |
|------|-------|
| Empty env (Coolify-like) | `false` |
| All required present | `true` |
| Missing only `YIKE_OTP_SERVER_TOKEN` | `false` |
| Missing only `SUPABASE_SERVICE_ROLE_KEY` | `false` |

### Production readiness — FAIL

Live Coolify process: `signupReady: false` until env is restored.

Startup behaviour when vars missing (`validateProductionEnvironment`):

- Logs `[yike] production env validation FAILED — missing required: …`
- **Does not throw** — container still boots (by design) so health/diagnostics remain reachable
- Signup APIs return 503

---

## 5. Required Environment Variables

### Required for signup readiness

| Variable | Role |
|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Must be `https://hlpojfurfldvcxfxhveg.supabase.co` (runtime + build) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public client |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin client for OTP/signup RPCs |
| `YIKE_OTP_SERVER_TOKEN` | Must equal DB `yike_internal_config.otp_server_token` |
| `NEXT_PUBLIC_SITE_URL` | `https://yike.ng` |
| `CRON_SECRET` | Ops health auth (required by env-validation) |
| `ENABLE_EMAIL_OTP` | Default `true`; set `false` only to intentionally disable |

### Strongly required for OTP email delivery

| Variable | Role |
|----------|------|
| `RESEND_API_KEY` | Send signup OTP email |
| From-address vars (`RESEND_FROM_EMAIL` / transactional from) | Must use allowed sender |

### Recommended

| Variable | Role |
|----------|------|
| `SENDCHAMP_WEBHOOK_SECRET` | Webhook fail-closed |
| `APP_ENV=production` | Production posture |
| `GIT_COMMIT_SHA` or `COOLIFY_SOURCE_COMMIT` | Health commit visibility |
| `BUILD_TIME` | Optional build stamp |

### Coolify checklist

1. Open Coolify application → Environment.
2. Confirm **all required** vars above are set (not empty / not build-arg-only for secrets).
3. Set OTP token from SQL Editor (do not paste into chat):

```sql
SELECT value FROM yike_internal_config WHERE key = 'otp_server_token';
```

4. Ensure Supabase URL/keys are **only** for `hlpojfurfldvcxfxhveg`.
5. **Restart** the container after env save (env inject).
6. Verify:

```bash
curl -sS https://yike.ng/api/auth/signup/ready
curl -sS https://yike.ng/api/public-health
```

Expect `ready: true` / `signupReady: true`.

7. Browser: one full signup + email OTP.

---

## 6. Regression Results (local codebase audit)

| Surface | Result | Notes |
|---------|--------|-------|
| Homepage route | PASS | File present; property-first by design |
| Signup form / API | PASS (code) / FAIL (prod env) | Form + routes exist; prod 503 until Coolify env |
| Login page | PASS | `src/app/auth/login/page.tsx` exists |
| Vehicle pages | PASS | `/vehicles` + detail routes present; switcher present |
| Property pages | PASS | `/properties/[slug]` present |
| Dealer onboarding | PASS | `dealer` in become-agent UI + API |
| Lex listings | PASS | Console listings page present |
| Search | PASS | Switcher on `/search` |
| Sitemap | PASS | `src/app/sitemap.ts` present |
| Typecheck | PASS | `tsc --noEmit` clean |

---

## 7. GO / NO-GO Recommendation

| Scope | Decision |
|-------|----------|
| Code deploy of `669eb789` | **GO** — already live |
| Signup / registration | **NO-GO** until Coolify env restored |
| Public Vehicle marketplace launch | **NO-GO** until signup ready |
| Homepage “marketplace redesign” | **N/A** — not a deploy defect; needs product approval |
| Overall public launch | **⛔ NO-GO** |

### Operator priority

1. **Restore Coolify secrets** (OTP token + service role + confirm Supabase URL/anon at runtime).  
2. Confirm `/api/auth/signup/ready` → `ready: true`.  
3. Complete one real signup.  
4. Only then revisit Vehicle public launch.  
5. Treat homepage multi-vertical upgrade as a **separate approved product task**, not incident recovery.

---

*Audit only — no repository commit created for this report.*
