# Route navigation audit

**Branch:** `feat/unified-three-vertical-marketplace`  
**Baseline commit:** `db5d9828` (shell + Messages tab)  
**Last updated:** 2026-10-26  

**Automated checks:** `src/lib/__tests__/route-navigation-audit.test.ts`, `src/lib/__tests__/consumer-navigation.test.ts`, `e2e/consumer-shell-connectivity.spec.ts`, `e2e/marketplace-routes-smoke.spec.ts`, `e2e/seller-journey-gates.spec.ts`, `e2e/staff-console-access.spec.ts`

## Build / type evidence (post-`db5d9828`)

| Check | Result | Notes |
|-------|--------|-------|
| `rm -rf .next && npm run build` | PASS | Clean build after route moves; no stale generated route types |
| `npx tsc --noEmit` | PASS | Run after production build |

## Summary

| Metric | Count |
|--------|------:|
| App routes (`page.tsx`) | ~253 |
| Consumer deep-audit rows | 45 |
| PASS (behavior or redirect evidence) | 40 |
| PARTIAL (shell OK, journey incomplete) | 5 |
| BLOCKED (env / staff creds / payments) | 8 |
| Lex routes (role-matrix sample) | ~200+ |

## Root causes fixed (shared — `db5d9828`+)

1. **Orphan route trees** — `conversations`, `trust`, `payments/history` now mount `ConsumerMarketplaceShell`.
2. **Messages tab** — Authenticated bottom nav includes `consumerRoute("messages")`.
3. **Thread back path** — `/conversations/[id]` uses `ConsumerSubpageHeader` → inbox (`Link`, not `router.push`).
4. **320px crowding** — Bottom nav uses flex `basis-0`, smaller FAB/icons at `max-[380px]`, auth tab label **Inbox** (same href as Messages).

## Consumer route checklist

| Route | Audience | Layout / nav | Primary action → next | Evidence | Status | Notes |
|-------|----------|--------------|------------------------|----------|--------|-------|
| `/` | Public | `(public)` + bottom nav | Browse → detail | E2E smoke | PASS | |
| `/discover` | Public | `(public)` + bottom nav | Swipe → listing | E2E | PASS | |
| `/search` | Public | `(public)` + bottom nav | Filter → detail | E2E smoke | PASS | |
| `/saved` | Public / auth | `(public)` + bottom nav | Open saved listing | E2E | PASS | |
| `/vehicles`, `/electronics`, `/properties/*` | Public | `(public)` | View listing | E2E smoke | PASS | Verticals gated by `isLaunchFeatureVisible` on home/discover only |
| `/account/coins` | Auth | `(public)` + subpage header | Top-up / send YC | E2E redirect | PASS | Paystack blocked without env |
| `/conversations` | Auth | `conversations/layout` | Open thread | E2E redirect + unit | PASS | `db5d9828` |
| `/conversations/[id]` | Auth | Same layout | Back → inbox | Unit + E2E redirect | PARTIAL | Subpage header + login `next` verified; in-thread send/call needs auth fixture |
| `/trust/[userId]` | Public | `trust/layout` | View trust profile | Unit | PASS | |
| `/payments/history` | Auth | `(public)/payments/history` | View receipts | Unit | PASS | Moved under `(public)` |
| `/payments/callback` | Auth | Minimal (intentional) | Return from Paystack | Manual | PASS | No bottom nav by design |
| `/agent/*` | Agent | `agent/layout` | Manage listings | E2E gates | PASS | Unauthed → login with `next` |
| `/auth/*` | Public | Minimal | Sign in → `next` | E2E auth | PASS | `safe-next-path` |
| `/seller/*` | Seller (deep link) | `seller/layout` | CRM / listings | Unit shell | PARTIAL | **Not** launch-hidden; no main-nav link; public render, trust-gated APIs |
| `/developers`, `/developers/*` | Public docs | `(public)` | Read API docs | E2E GET only | PARTIAL | Portal visible; not linked from bottom nav; no launch flag |

## Seller vs agent vs launch flags

| Journey | Entry | Launch flag | Auth | Evidence |
|---------|-------|-------------|------|----------|
| List property (MVP) | Bottom nav **Sell** → `/post-property` | N/A | Optional browse | Product standard |
| Agent hub | Bottom nav **Profile** → `/agent` | N/A | Required for manage | E2E seller gates |
| Seller workspace | `/seller`, `/seller/crm`, … | **None** (not in `launch-mode`) | Not enforced at page level | Shell unit test; no nav discovery |
| Vehicle/electronics create API | `/agent/listings/new/*` | `vehicle_marketplace`, `electronics_marketplace` | Required | API + home toggle |

## Lex / staff (by role — not full route crawl)

**Consoles:** `/lex` (login) · `/lex/auth/*` (Auth console) · `/lex/support/*` · `/lex/tech/*`  
**Nav filtering:** `authNavAllowlist()` in `src/lib/admin/roles.ts` + `filterNavForRole` in auth layout.

| Role | Auth console access | Sample routes | E2E evidence |
|------|---------------------|---------------|--------------|
| Anonymous | None | `/lex/auth/overview` → `/lex` | `staff-console-access.spec.ts` PASS |
| `super_admin` / `admin` | Full auth nav | `/lex/auth/overview`, staff users | NOT TESTED (needs staff session) |
| `moderator` | overview, listings, agents, reports, reviews | `/lex/auth/listings` | NOT TESTED |
| `content` | overview, listings, featured, ads, banners, … | `/lex/auth/featured` | NOT TESTED |
| `careers` | overview, careers | `/lex/auth/careers` | NOT TESTED |
| `support` | Support console only | `/lex/support` | NOT TESTED |
| `tech` | Tech console only | `/lex/tech` | NOT TESTED |

**Shared checks (anonymous):** `/admin` → 404; consumer `/auth/login` ≠ staff `/lex`; `POST /api/staff/verify-access` → 401.

## Blocked / not genuinely verified

| Journey | Blocker |
|---------|---------|
| Paystack top-up E2E | `PAYSTACK_SECRET_KEY` + `ENABLE_PAYMENTS` |
| Send YC E2E | Auth session + username RPC on linked DB |
| Video call E2E | Agora / provider config |
| SMS OTP E2E | SendChamp credentials |
| Authenticated 320px nav (5 + FAB) | Playwright auth fixture not in repo |
| Browser back from thread | Manual / authed E2E |
| Full Lex matrix per role | Staff credentials |

## Evidence / commits

| Slice | Commit | Verification |
|-------|--------|--------------|
| Wallet + subpage header | `eba3bd0d` | Unit wallet UI test |
| Orphan shell + Messages tab | `db5d9828` | Unit route audit |
| Build/tsc baseline | — | `npm run build`, `tsc --noEmit` post-`db5d9828` |
| Thread back + 320px nav + E2E | _(see commit below)_ | `route-navigation-audit.test.ts` 8/8; Playwright consumer-shell 10/10, marketplace-smoke 9/9, seller-gates 4/4, staff-console 6/6 |

## Maintenance

When adding a consumer-facing page:

1. Place under `src/app/(public)/…` **or** add `layout.tsx` importing `ConsumerMarketplaceShell`.
2. Add `ConsumerSubpageHeader` when the page is not a top-level tab destination.
3. Link internal destinations via `consumerRoute()` / `CONSUMER_ROUTES`.
4. Extend `route-navigation-audit.test.ts` and E2E only with **observable** behavior (redirect, link target, overflow)—not compile-only PASS.
