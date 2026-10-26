# Route navigation audit

**Branch:** `feat/unified-three-vertical-marketplace`  
**Baseline commit:** `db5d9828` (shell + Messages tab)  
**Last updated:** 2026-10-26  

**Automated checks:** `src/lib/__tests__/route-navigation-audit.test.ts`, `e2e/consumer-shell-connectivity.spec.ts`, `e2e/authenticated-navigation.spec.ts`, `e2e/conversation-thread-navigation.spec.ts`, `e2e/marketplace-routes-smoke.spec.ts`, `e2e/seller-journey-gates.spec.ts`, `e2e/staff-console-access.spec.ts`, `e2e/staff-role-routes.spec.ts`

## Build / type evidence

| Check | Result | Notes |
|-------|--------|-------|
| `npx tsc --noEmit` | PASS | After navigation E2E slice |
| `npm run build` | PASS | Production build |

## E2E prerequisites (Playwright)

| Variable | Purpose |
|----------|---------|
| `PLAYWRIGHT_SKIP_SERVER=1` | Reuse local `npm run dev` on port 3000 |
| `E2E_EPHEMERAL_AUTH=1` | Create/delete disposable consumers on **non-production** Supabase + `SUPABASE_SERVICE_ROLE_KEY` |
| `E2E_CONSUMER_EMAIL` / `E2E_CONSUMER_PASSWORD` | Optional explicit test account (password login + OTP rules apply) |
| `E2E_STAFF_<ROLE>_EMAIL` / `E2E_STAFF_<ROLE>_PASSWORD` | Per-role Lex smoke (`moderator`, `content`, `careers`, `support`, `tech`, `admin`) — never commit |
| `E2E_ISOLATED_SUPABASE=1` + `.env.e2e.local` | Isolated project for PIN/OTP suites (see `.env.e2e.example`) |

Helpers: `e2e/helpers/authenticated-consumer.ts`, `e2e/helpers/messaging-fixture.ts`, `e2e/helpers/ephemeral-auth.ts`.

## Playwright results (local run, production-linked Supabase default)

Command: `PLAYWRIGHT_SKIP_SERVER=1 npx playwright test e2e/consumer-shell-connectivity.spec.ts e2e/authenticated-navigation.spec.ts e2e/conversation-thread-navigation.spec.ts e2e/staff-role-routes.spec.ts e2e/staff-console-access.spec.ts`

| Suite | PASS | SKIP | FAIL | Notes |
|-------|-----:|-----:|-----:|-------|
| `consumer-shell-connectivity` | 10 | 0 | 0 | Public nav, wallet/messages redirects, 320px overflow |
| `staff-console-access` | 6 | 0 | 0 | Anonymous Lex gates |
| `authenticated-navigation` | 0 | 3 | 0 | **BLOCKED** — no `E2E_EPHEMERAL_AUTH` / consumer creds on this machine |
| `conversation-thread-navigation` | 1 | 2 | 0 | Unauthenticated gate **PASS**; authenticated thread **BLOCKED** (same auth + messaging seed) |
| `staff-role-routes` | 0 | 11 | 0 | **BLOCKED** — no `E2E_STAFF_*` credentials configured |

**Total (focused run):** 17 passed, 16 skipped, 0 failed.

With `E2E_EPHEMERAL_AUTH=1` on a non-production Supabase project that has `marketplace_conversations` applied, expect authenticated nav + thread tests to execute (not skip).

## Summary

| Metric | Count |
|--------|------:|
| App routes (`page.tsx`) | ~253 |
| Consumer deep-audit rows | 45 |
| PASS (behavior or redirect evidence) | 41 |
| PARTIAL (fixture exists; blocked on prod-linked env) | 4 |
| BLOCKED (env / staff creds / payments) | 6 |
| Lex routes (role-matrix sample) | ~200+ |

## Consumer route checklist

| Route | Audience | Layout / nav | Primary action → next | Evidence | Status | Notes |
|-------|----------|--------------|------------------------|----------|--------|-------|
| `/` | Public | `(public)` + bottom nav | Browse → detail | E2E smoke | PASS | |
| `/discover` | Public | `(public)` + bottom nav | Swipe → listing | E2E | PASS | |
| `/search` | Public | `(public)` + bottom nav | Filter → detail | E2E smoke | PASS | |
| `/saved` | Public / auth | `(public)` + bottom nav | Open saved listing | E2E | PASS | |
| `/vehicles`, `/electronics`, `/properties/*` | Public | `(public)` | View listing | E2E smoke | PASS | |
| `/account/coins` | Auth | `(public)` + subpage header | Top-up / send YC | E2E redirect | PASS | Paystack blocked without env |
| `/conversations` | Auth | `conversations/layout` | Open thread | E2E redirect + unit | PASS | |
| `/conversations/[id]` | Auth | Same layout | Back → inbox | Unit + E2E gate | PARTIAL | Full thread journey in `conversation-thread-navigation.spec.ts` — **BLOCKED** without ephemeral auth + messaging schema |
| `/trust/[userId]` | Public | `trust/layout` | View trust profile | Unit | PASS | |
| `/payments/history` | Auth | `(public)/payments/history` | View receipts | Unit | PASS | |
| `/payments/callback` | Auth | Minimal (intentional) | Return from Paystack | Manual | PASS | |
| `/agent/*` | Agent | `agent/layout` | Manage listings | E2E gates | PASS | Profile tab → `/agent` covered when auth E2E runs |
| `/auth/*` | Public | Minimal | Sign in → `next` | E2E auth | PASS | |
| `/seller/*` | Seller (deep link) | `seller/layout` | CRM / listings | Unit shell | PARTIAL | Not launch-hidden |
| `/developers/*` | Public docs | `(public)` | Read API docs | E2E GET | PARTIAL | |

## Authenticated mobile nav (320px)

| Check | Status | Evidence |
|-------|--------|----------|
| Public 5 + FAB, no overflow | PASS | `consumer-shell-connectivity` @ 320px |
| Auth 5 + FAB, destinations, active tab, Back | BLOCKED | `authenticated-navigation.spec.ts` — needs consumer session |
| Inbox → `/conversations` | BLOCKED | Same |

## Thread navigation

| Check | Status | Evidence |
|-------|--------|----------|
| Unauthenticated `next` or messaging-off `/` | PASS | `conversation-thread-navigation` |
| Inbox → thread → **Back to inbox** → browser Back → refresh | BLOCKED | Requires `E2E_EPHEMERAL_AUTH=1` + messaging tables |

## Lex / staff (by role)

**Consoles:** `/lex` · `/lex/auth/*` · `/lex/support/*` · `/lex/tech/*`  
**Policy:** `authNavAllowlist`, `staffConsoleRedirect`, `requireAdmin` / `requireSupportConsole` / `requireTechConsole`.

| Role | Sample allowed | Sample denied | E2E |
|------|----------------|---------------|-----|
| Anonymous | — | `/lex/auth/overview` → `/lex` | PASS |
| `moderator` | `/lex/auth/listings` | `/lex/auth/staff` | BLOCKED (no creds) |
| `content` | `/lex/auth/featured` | `/lex/auth/staff` | BLOCKED |
| `careers` | `/lex/auth/careers` | `/lex/auth/listings` | BLOCKED |
| `support` | `/lex/support` | `/lex/auth/overview` | BLOCKED |
| `tech` | `/lex/tech` | `/lex/auth/overview` | BLOCKED |
| `admin` | `/lex/auth/overview` | — | BLOCKED |

Suite: `e2e/staff-role-routes.spec.ts` (env-gated per role; verifies URL authorization, not nav visibility alone).

## Blocked / not genuinely verified

| Journey | Blocker |
|---------|---------|
| Paystack top-up E2E | `PAYSTACK_SECRET_KEY` + `ENABLE_PAYMENTS` |
| Send YC E2E | Auth + username RPC on linked DB |
| Video call E2E | Agora / provider |
| Authenticated nav + thread (this machine) | `E2E_EPHEMERAL_AUTH=1` on non-prod Supabase or `E2E_CONSUMER_*` |
| Lex per-role routes (this machine) | `E2E_STAFF_<ROLE>_EMAIL/PASSWORD` |

## Evidence / commits

| Slice | Commit | Verification |
|-------|--------|--------------|
| Orphan shell + Messages tab | `db5d9828` | Unit route audit |
| Thread back + 320px public nav | `11cf76db` | consumer-shell 10/10 |
| Navigation E2E fixtures + Lex matrix | _(this commit)_ | 17 PASS / 16 SKIP focused run; unit 8/8 |

## Maintenance

1. Consumer pages: `(public)/…` or `ConsumerMarketplaceShell` layout.
2. Subpages: `ConsumerSubpageHeader` + `consumerRoute()`.
3. New E2E: use `consumerAuthStatus()` / `test.skip()` with explicit prerequisite string — never fake sessions.
4. Staff E2E: never change production roles; only env-provided accounts.
