# Offline-first reliability audit

**Branch:** `feat/unified-three-vertical-marketplace`  
**Updated:** 2026-10-26  
**HEAD (offline + wallet guards):** `455c42f0`  

## Scope

Local development must not depend on `yike.ng`, Hetzner deploy health, or live Paystack/production DB mutations unless explicitly opted in.

## Local origin and payment return URLs

| Check | Result | Evidence |
|-------|--------|----------|
| `getSiteBaseUrl()` prefers `http://localhost:PORT` in development | **PASS** | `src/lib/payments/config.ts` |
| `NEXT_PUBLIC_SITE_URL=https://yike.ng` rewritten to localhost in dev | **PASS** | same |
| `PAYSTACK_CALLBACK_URL` / webhook env pointing at `yike.ng` rewritten in dev | **PASS** | `resolveAppAbsoluteUrlForRuntime` + `offline-dev-urls.test.ts` |
| Client navigation uses relative `/api/*` for wallet, payments, search | **PASS** | wallet hero, callback client, agent balance |
| SEO/canonical constants still use production `SITE_URL` | **PASS (intentional)** | `src/lib/constants.ts` — not used for runtime API |

## Payment and wallet mutation guards

| Check | Result | Evidence |
|-------|--------|----------|
| `/api/payments/initialize` blocks live Paystack + prod DB in dev | **PASS** | `guardLocalPaymentMutation` |
| `/api/payments/reconcile` same guard | **PASS** | reconcile route |
| Wallet top-up UI shows guard message before checkout | **PASS** | `getWalletTopupCheckoutStatus` |
| Payment callback never trusts redirect params alone | **PASS** | `payment-callback-local.test.ts` |
| Callback success dispatches authoritative balance refresh event | **PASS** | `dispatchYikeCoinsBalanceChanged` |
| Dev test credit route 404 in production APP_ENV | **PASS** | `test-credit/route.ts` |
| Dev test credit blocked on production Supabase ref without opt-in | **PASS** | `guardLocalDatabaseMutation` |
| Agent dashboard uses hero balance API (no duplicate wallet card) | **PASS** | `agent-dashboard-wallet.test.ts` |

## PWA / offline UX

| Check | Result | Evidence |
|-------|--------|----------|
| SW does not replace auth routes with `/offline` in local dev | **PASS** | `app-mode-inline.ts`, `register.tsx` |
| Offline banner keeps marketplace visible | **PASS** | `offline-banner.tsx` |
| Payment routes network-required in SW | **PASS** | `pwa-offline-nav.test.ts` |

## Homepage consistency (2026-10-26)

| Check | Result | Evidence |
|-------|--------|----------|
| Default unified header search pill (mobile + desktop) | **PASS** | `392a14f3`, `home-unified-header-search.spec.ts` |
| Properties mobile filter bar matches Vehicles shell | **PASS** | shared `HomeMobileFilterShell` |
| Desktop electronics category chips match vehicle/property styling | **PASS** | `home-desktop-electronics-search.tsx` chip classes |
| Expanded filters in document flow (no overlap on Latest on Yike) | **PASS** | `home-hero-search-layout.spec.ts`, `home-mobile-filter-shell.tsx` |

## Integration / production-linked env

| Check | Result | Notes |
|-------|--------|-------|
| `npm run verify:dev-target` on typical `.env.local` | **BLOCKED for safe integration** | Linked ref is often production — do **not** run `test:dev:integration` without non-prod target |
| `YIKE_DEV_DB_INTEGRATION=1` wallet RPC suite | **BLOCKED** | `verify:integration-supabase` + allowlist; production ref refused |
| `npm run test:e2e:wallet` (agent auth journey) | **PARTIAL** | 5 PASS / 2 SKIP without `.env.e2e.local` |
| Live Paystack webhook E2E | **BLOCKED** | Ops keys + tunnel |

## Remaining blockers

1. **Isolated Supabase** for authenticated E2E (signup, agent wallet round-trip, messaging) — see `RELEASE_BLOCKER_REPORT.md` P0.
2. **Founder `.env.local`** with production ref + live keys — guards prevent accidental checkout/credits; use test keys or dev credit flag on a **non-production** database for wallet QA.
3. **Paystack fulfilment** still requires server verify/webhook — local checkout only safe with test keys and non-prod DB.
