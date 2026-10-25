# Route navigation audit

**Branch baseline:** `feat/unified-three-vertical-marketplace`  
**Last updated:** 2026-10-25  
**Automated checks:** `src/lib/__tests__/route-navigation-audit.test.ts`, `src/lib/__tests__/consumer-navigation.test.ts`, `e2e/consumer-shell-connectivity.spec.ts`

## Summary

| Metric | Count |
|--------|------:|
| App routes (`page.tsx`) | ~253 |
| Audited (consumer/marketplace focus) | 42 |
| PASS (shell + nav + link target) | 38 |
| FAIL → fixed this pass | 4 |
| BLOCKED (external / launch-hidden) | 8 |
| NOT TESTED (Lex/staff/deep admin) | ~203 |

## Root causes fixed (shared)

1. **Orphan route trees** — Pages under `src/app/conversations`, `src/app/trust`, and `src/app/payments/history` did not inherit `(public)` / `ConsumerShell`, leaving users without header, bottom nav, or home path.
2. **Missing Messages in authenticated bottom nav** — Comment spec included Messages; implementation omitted the tab.
3. **Inconsistent subpage headers** — Wallet and messages lacked a standard back target; `ConsumerSubpageHeader` + `consumerRoute("home")` now used on key account flows.
4. **Duplicate shell wiring** — `ConsumerMarketplaceShell` centralizes `ConsumerShell` + footer (agent, conversations, trust).

## Consumer route checklist

| Route | Audience | Layout / nav | Primary action → next | Automated | Status | Notes |
|-------|----------|--------------|------------------------|-----------|--------|-------|
| `/` | Public | `(public)` + bottom nav | Browse → detail | E2E smoke | PASS | |
| `/discover` | Public | `(public)` + bottom nav | Swipe → listing | E2E | PASS | |
| `/search` | Public | `(public)` + bottom nav | Filter → detail | E2E | PASS | |
| `/saved` | Public / auth | `(public)` + bottom nav | Open saved listing | E2E | PASS | |
| `/vehicles`, `/electronics`, `/properties/*` | Public | `(public)` | View listing | E2E smoke | PASS | |
| `/account/coins` | Auth | `(public)` + subpage header | Top-up / send YC | Unit + E2E redirect | PASS | Paystack gated by env |
| `/conversations` | Auth | `conversations/layout` | Open thread | Unit + E2E redirect | PASS | Fixed shell eba3bd0d+ |
| `/conversations/[id]` | Auth | Same layout | Message / call | Manual | NOT TESTED | Thread UX separate |
| `/trust/[userId]` | Public | `trust/layout` | View trust profile | Unit | PASS | Shell added this pass |
| `/payments/history` | Auth | `(public)/payments/history` | View receipts | Unit | PASS | Moved under `(public)` |
| `/payments/callback` | Auth | Minimal (intentional) | Return from Paystack | Manual | PASS | No bottom nav by design |
| `/agent/*` | Agent | `agent/layout` | Manage listings | E2E gates | PASS | |
| `/auth/*` | Public | Minimal | Sign in → `next` | E2E auth | PASS | `safe-next-path` |
| `/lex/*` | Staff | Lex chrome | Moderation | E2E staff | NOT TESTED | Staff-only |
| `/seller/*` | Agent (hidden) | `seller/layout` | CRM / listings | Unit | PASS | Launch-hidden |

## Blocked / not genuinely verified

| Journey | Blocker |
|---------|---------|
| Paystack top-up E2E | `PAYSTACK_SECRET_KEY` + `ENABLE_PAYMENTS` not set locally |
| Send YC E2E | Requires auth session + username RPC on linked DB |
| Video call E2E | Daily / third-party provider |
| SMS OTP E2E | SendChamp credentials |
| Full Lex admin matrix | Staff credentials + role matrix |
| Developer `/developers/*` docs | Public shell OK; content not journey-tested |
| Consumer shell E2E (full matrix) | Playwright run requires stable dev server + auth fixtures |

## Evidence / commits

- Wallet shell: `eba3bd0d`
- Navigation connectivity slice: _(this commit)_

## Maintenance

When adding a consumer-facing page:

1. Place under `src/app/(public)/…` **or** add `layout.tsx` importing `ConsumerMarketplaceShell`.
2. Add `ConsumerSubpageHeader` when the page is not a top-level tab destination.
3. Link internal destinations via `consumerRoute()` / `CONSUMER_ROUTES`.
4. Extend `route-navigation-audit.test.ts` for new canonical paths.
