# Final Marketplace UX Polish — Reports

**Status:** Implemented locally · **hold commit** (founder review)  
**Date:** 2026-07-23  
**Scope:** Polish only — no homepage redesign, no new homepage sections.

---

## 1. Homepage Polish Report

### Remember location
- `ensureMarketplaceLocationPersisted()` re-hydrates cookies from `localStorage` on homepage bootstrap + header indicator mount.
- Preference exists → **never** re-prompts geolocation/picker; Enugu stays Enugu until the user changes it.
- `PrefSync` no longer overwrites marketplace city cookies with browse-history cities.
- City-only legacy prefs still load (state no longer required to “remember”).

### Empty / thin inventory
- Rails already expand: city → nearby cities → state → nearby states → nationwide (`pickLocationAwareRail`).
- Featured rail falls back to non-featured inventory when no featured items exist (avoids blank featured strip).
- Thin-city banner: “No listings found in {City} yet.” + “Showing nearby cities and across Nigeria below.”
- Totally empty: `LocationThinEmptyState` with **Nearby · {State}** and **Across Nigeria** CTAs.
- Empty individual rails are omitted when other rails / nationwide still have inventory (no blank homepage when stock exists elsewhere).

### Aspect ratio
- Shared `BROWSE_THUMB_ASPECT = aspect-[4/5]` for property + vehicle browse cards at all breakpoints (no uneven media heights).

### Micro polish
- Empty-state spacing/typography/hover aligned to navy/gold.
- Section “View all” hover tone; sticky category chrome unchanged.
- Skeletons + existing `animate-fade-up` retained; no new architecture.

---

## 2. Responsive UI Report

| Breakpoint | Grid | Notes |
|------------|------|--------|
| Mobile (&lt;640) | 2 cols | Fixed 4:5 thumbs; sticky category under header |
| Tablet (sm–md) | 3–4 cols | Same thumb ratio; padding `px-3` → `sm:px-6` |
| Desktop (lg+) | 6–8 cols | `max-w-7xl`; header location chip + search |

- Location chip truncates safely (`max-w-[7.5rem]`).
- Category toggle stays centered (`max-w-sm` / `sm:max-w-md`).
- No new homepage sections; download-app block unchanged.

**Localhost:** `GET /` → **200**, `GET /?category=vehicle` → **200** (2026-07-23).

---

## 3. Performance Optimization Report

| Change | Effect |
|--------|--------|
| Dropped separate luxury + state property queries | Fewer Supabase round-trips; luxury/state derived from pool |
| Vehicle: featured + recent(36) + local only | Dropped dedicated luxury / low-mileage queries |
| Recent pool 24 → 36 | Slightly larger single fetch, fewer parallel queries overall |
| Browse `priorityImage` default **2** (was 6) | Less eager image decode above the fold |
| Vehicle browse: `loading="lazy"` unless priority | Below-fold thumbs defer |
| Smooth scroll already on `html` | Kept; no layout thrash added |

Payload stays rail-sized (≈6 items/rail). Skeletons OK via existing `Suspense` + `PropertyGridSkeleton`.

---

## 4. Production Readiness Report

| Gate | Status |
|------|--------|
| Code polish (this doc) | Ready for review |
| Commit / push | **Hold** — founder review first |
| Migration `20260723153614_seller_verification_onboarding_v1.sql` | **Apply before prod** (SQL Editor or verified `db:push`) |
| Sendchamp public key | **Rotate** if previously exposed; set new value in Coolify |
| `tsc --noEmit` | Pass (local) |
| Localhost homepage | Pass (200) |
| Coolify env | See §5 checklist |

**Do not ship** seller phone OTP / verification gates until migration + Sendchamp secrets are live.

---

## 5. Coolify Environment Checklist

Set in Coolify → Application → Environment. **Never paste real secrets into chat or git.**

Use placeholders only below.

### Critical (launch candidate)

| Key | Required? | Example / placeholder | Notes |
|-----|-----------|----------------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | `https://hlpojfurfldvcxfxhveg.supabase.co` | Production project only |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | `<supabase-anon-or-publishable-key>` | Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | `<supabase-service-role-key>` | Server-only; never `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_SITE_URL` | Yes | `https://yike.ng` | Auth redirects / absolute URLs |
| `YIKE_OTP_SERVER_TOKEN` | Yes | `<otp-server-token>` | Must match `yike_internal_config` in DB |
| `SENDCHAMP_PUBLIC_KEY` | Yes (SMS OTP) | `<rotated-sendchamp-public-key>` | **Rotate if exposed** · Sendchamp → Account Settings |
| `SENDCHAMP_LIVE_BASE_URL` | Yes (SMS OTP) | `https://api.sendchamp.com/api/v1` | Live API base |
| `SENDCHAMP_WEBHOOK_SECRET` | Yes (webhooks) | `<sendchamp-webhook-secret>` | Fail-closed if unset in prod |
| `SENDCHAMP_WEBHOOK_URL` | Recommended | `https://yike.ng/api/webhooks/sendchamp` | Register in Sendchamp |
| `SENDCHAMP_API_KEY` | Yes (Verification API) | `<sendchamp-live-api-key>` | Server-only |
| `SENDCHAMP_OTP_CHANNEL` | Recommended | `sms` | SMS primary |
| `SENDCHAMP_SMS_SENDER` | Recommended | `YIKE` | Approved sender ID |
| `ENABLE_PHONE_OTP` | Yes (seller phone) | `true` | Server gate |
| `ENABLE_SMS_OTP` | Yes (seller phone) | `true` | Server gate |
| `NEXT_PUBLIC_ENABLE_PHONE_OTP` | Yes (UI) | `true` | Mirrors server for seller UI |
| `ENABLE_WHATSAPP_OTP` | Recommended | `false` | Keep off until WA Business ready |
| `NEXT_PUBLIC_ENABLE_WHATSAPP_OTP` | Recommended | `false` | Client mirror |
| `ENABLE_EMAIL_OTP` | Yes | `true` | Signup / login OTP |
| `RESEND_API_KEY` | Yes (email OTP) | `<resend-api-key>` | Resend dashboard |
| `AUTH_EMAIL_FROM` | Recommended | `Yike <hello@yike.ng>` | Domain must be verified |
| `CRON_SECRET` | Yes | `<cron-secret>` | Cron / health auth |
| `YIKE_PIN_PEPPER` | Yes (PIN) | `<long-random-pepper-min-32-chars>` | Server-only |

### Strongly recommended

| Key | Required? | Example / placeholder | Notes |
|-----|-----------|----------------------|--------|
| `APP_ENV` | Recommended | `production` | Production posture |
| `ENABLE_VEHICLE_MARKETPLACE` | Recommended | `true` | Vehicles in marketplace |
| `YIKE_LAUNCH_MODE` | Optional | `true` | Hides deferred surfaces |
| `YIKE_WHATSAPP_NUMBER` | Recommended | `2348035143299` | Lead gateway line |
| `YIKE_LEAD_GATEWAY_ENABLED` | Recommended | `true` | WhatsApp-first leads |
| `ENABLE_FEATURED_LISTINGS` | Optional | `true` | Featured UI |
| `NEXT_PUBLIC_ENABLE_FEATURED_LISTINGS` | Optional | `true` | Client mirror |
| `ENABLE_FEATURED_PAYMENTS` | Optional | `false` | Until Paystack live |
| `PAYSTACK_SECRET_KEY` | Optional | `<paystack-secret-key>` | Server-only |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Optional | `<paystack-public-key>` | Public checkout key |
| `ADMIN_ALERT_EMAIL` | Optional | `hello@yike.ng` | Moderation alerts |
| `SENDCHAMP_OTP_EXPIRY_MINUTES` | Optional | `30` | OTP TTL |
| `SENDCHAMP_OTP_LENGTH` | Optional | `6` | OTP digits |

### Leave off / deferred (launch freeze)

| Key | Value | Notes |
|-----|-------|--------|
| `ENABLE_PASSPORT_UI` | `false` | Deferred |
| `ENABLE_ESCROW` / `ENABLE_WALLET` | `false` | BayRight owns finance |
| `ENABLE_HOME_SERVICES` / `NEXT_PUBLIC_ENABLE_HOME_SERVICES` | `false` | Deferred |
| `ENABLE_SAFEHAVEN*` | `false` | Prep only |
| `ENABLE_DIRECT_AGENT_WHATSAPP` | `false` | Concierge-first |
| `ENABLE_DIRECT_AGENT_CALLS` | `false` | WhatsApp-first |

### Founder reminders

1. Apply migration **`supabase/migrations/20260723153614_seller_verification_onboarding_v1.sql`** on production (`hlpojfurfldvcxfxhveg`) before relying on seller verification columns.
2. **Rotate** `SENDCHAMP_PUBLIC_KEY` (and API key if exposed) after any leak; update Coolify, redeploy.
3. Confirm Supabase Auth redirect URLs include `https://yike.ng/auth/callback`.
4. Do **not** commit `.env` / real tokens.

See also: `.env.example`, `docs/launch/ENVIRONMENT_CHECKLIST.md`.
