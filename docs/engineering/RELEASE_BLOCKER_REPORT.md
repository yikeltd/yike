# Release blocker report

**Branch:** `feat/unified-three-vertical-marketplace`  
**Updated:** 2026-10-26 (account wallet ↔ agent dashboard connectivity)  
**Scope:** Verification gaps after navigation shell + public E2E (30 PASS / 16 SKIP on production-linked local env).

This report does **not** claim release readiness from a green production build or anonymous Playwright alone.

---

## Executive summary

| Area | Status | Blocker owner |
|------|--------|----------------|
| Anonymous consumer / marketplace browse E2E | **PASS** (35 via `test:e2e:marketplace`) | See **`MARKETPLACE_E2E_AUDIT.md`** |
| Seller listing create / publish E2E | **BLOCKED** | Isolated Supabase + auth |
| Authenticated nav + messaging thread E2E | **BLOCKED** | Ops: create isolated Supabase + `.env.e2e.local` |
| Lex RBAC E2E (6 roles) | **BLOCKED** | Ops: staff test accounts in non-prod |
| YC wallet RPCs / ledger | **REVIEW** (14/14 integration on linked DB — not prod-readiness proof) | Reconcile migrations before prod `db push`; re-run integration only on approved non-prod target |
| Paystack checkout E2E | **BLOCKED** (code **11/11** unit PASS) | **`PAYSTACK_READINESS_AUDIT.md`**; live webhook + keys ops-owned |
| Migration filename drift (branch vs applied prod) | **P0 — ops** | Peer-transfer **repo defect fixed** (`261500`/`261510`); version-ID tail still mismatched — **`YC_WALLET_MIGRATION_RECONCILIATION.md`** — **no prod `db push`** |

---

## Account wallet connectivity (2026-10-26)

**Root cause:** `/account/coins` always showed “Back to home” while the agent dashboard hero linked to a bare wallet URL with no return context — agents could reach the wallet but not navigate back to `/agent` without using bottom nav.

**Fix:** `src/lib/navigation/account-routes.ts` — `walletPath`, `walletAuthLoginPath`, `resolveWalletBackNavigation`. Agent hero + legacy wallet card use `?from=agent`; wallet page binds balance to `user.id` (unchanged) and sets back link from `from` + profile role. Payment callback CTAs use `walletPath()`.

**Regression:** `src/lib/__tests__/account-route-connectivity.test.ts` (9 tests); `e2e/account-wallet-connectivity.spec.ts` (2 PASS unauthenticated, 1 SKIP without agent session).

**Not verified (BLOCKED):** Authenticated agent dashboard → wallet → back journey (needs isolated Supabase + `E2E_EPHEMERAL_AUTH=1`).

---

## Marketplace audit (2026-10-26)

- **Playwright:** 32/32 PASS on marketplace-focused specs (browse, search, discover, seller gates, shell).
- **Unit:** listing-create/seller routes 34/34; seller-contact route guard 2/2; route audit 8/8.
- **Fixed:** `GET /api/listings/[id]/seller-contact` binds `sellerId` to listing via `assetType` + `resolveListingSeller` (`4e90fb99`).
- **Fixed:** `POST /api/listing-leads/capture` binds listing-bound leads via `validateLeadRequest`; session-only buyer id (`listing-leads-capture-route.test.ts` 2/2).
- **Not run:** DB integration (production-linked `verify:dev-target`); authenticated seller wizard E2E.

Full matrix: **`docs/engineering/MARKETPLACE_E2E_AUDIT.md`**.

---

## P0 — Must close before claiming auth/messaging release-ready

### 1. Isolated Supabase for E2E

**Requirement:** Ephemeral auth and messaging seed **must not** target `hlpojfurfldvcxfxhveg`. Guards: `e2e/helpers/ephemeral-auth.ts`, `scripts/verify-e2e-supabase-target.mjs`.

**Current state:**

- No `.env.e2e.local` in repo (gitignored; not provisioned on this machine).
- Retired sandbox ref: `gyxemepnrkwxocgzfbeo`.
- Supabase org currently exposes production project only — **founder/ops must create a new non-production project**.

**Commands (after `.env.e2e.local` exists):**

```bash
npm run e2e:nav-prereqs:isolated    # must PASS before Playwright
npm run verify:e2e-supabase
# link isolated ref, apply migrations, seed yike_internal_config (otp_server_token)
npm run test:e2e:navigation
```

**Expected outcome:** 5 consumer specs un-skip (authenticated nav + thread); staff specs remain blocked until P1.

---

### 2. Lex authorization E2E

**Spec:** `e2e/staff-role-routes.spec.ts` (11 tests skipped without creds).

**Requirement:** Six dedicated non-production staff users — one per role — with env pairs:

`E2E_STAFF_<ROLE>_EMAIL` / `E2E_STAFF_<ROLE>_PASSWORD` for `moderator`, `content`, `careers`, `support`, `tech`, `admin`.

**Rule:** Never mutate production role assignments for tests; only use env-provided accounts on isolated (or approved staging) Supabase.

---

## P1 — Wallet / payments production readiness (code verified; ops gating)

### 3. Yike Coins (YC) wallet

**Code review (no production data mutation in this pass):**

| Concern | Evidence |
|---------|----------|
| Peer transfer distinct ledger refs | `20261026142000_peer_transfer_distinct_ledger_references.sql` (`-IN` suffix pattern); prod has applied peer-transfer fixes under `202610251949*` timestamps |
| Idempotency replay (sender/amount/recipient) | `20261026150000_peer_transfer_idempotency_recipient.sql` |
| Admin grants + audit | `20261026120000_yc_transfers_admin_grants.sql` |
| Username RPC ambiguity | `20261026141000_fix_profile_set_username_ambiguous.sql` |

**Integration tests (2026-10-25; not re-run 2026-10-26):** `YIKE_DEV_DB_INTEGRATION=1 npm run test:dev:integration` → **14/14 PASS** (~72s) after `npm run verify:dev-target` (linked ref `hlpojfurfldvcxfxhveg`). Covers debit/credit idempotency, concurrent debits, peer transfer, admin grant, video allowance.

**Release note:** That pass is evidence for **RPC behavior on the linked database only**, not production readiness. Reconcile branch `supabase/migrations/20261026*` against applied production history (`202610251949*` peer-transfer timestamps differ from local filenames) before any production `db push`.

**Local-only migrations (verify on prod before deploy narrative):**

- `20261026120000_yc_transfers_admin_grants.sql`
- `20261026140000_profile_username_change_guard.sql`
- `20261026141000_fix_profile_set_username_ambiguous.sql`
- `20261026142000_peer_transfer_distinct_ledger_references.sql`
- `20261026150000_peer_transfer_idempotency_recipient.sql`

---

### 4. Paystack

**Implementation (review only):**

- Webhook entrypoints: `/api/payments/webhook`, legacy `/api/webhooks/paystack` → `getFinancialPlatform().payment.processWebhook`.
- Signature: HMAC-SHA512(raw body, `PAYSTACK_SECRET_KEY`) vs `x-paystack-signature`; timing-safe compare — `src/lib/payments/providers/paystack.ts`.
- Unit tests: `src/lib/payments/providers/__tests__/paystack-signature.test.ts`.

**Blocked for E2E:**

- `ENABLE_PAYMENTS` / featured payments flags (`src/lib/admin/launch-health.ts`).
- Live checkout and webhook replay require production Paystack dashboard + secret key — **not exercised in this pass**.

**When authorized:** confirm webhook URL points to `https://yike.ng/api/payments/webhook`, send Paystack test event, verify order/ledger side effects in non-prod first.

---

## P2 — Already shipped (do not re-audit unless regression)

- Founder welcome email preview, favicon sync (`8b93269b`), TWA staff launcher icons (`6780088e`).
- Consumer shell orphan routes, thread back nav, 320px Inbox tab — commits through `6780088e`.

---

## Pre-push verification (2026-10-26, commit slice)

| Check | Command | Result |
|-------|---------|--------|
| E2E Supabase guard | `npm run verify:e2e-supabase` | **SKIP/FAIL (exit 1)** — no `.env.e2e.local`; must not run against production |
| Isolated nav prereqs | `npm run e2e:nav-prereqs:isolated` | **FAIL (exit 1)** — missing `.env.e2e.local` (fail-closed) |
| Default nav prereqs | `npm run e2e:nav-prereqs` | **FAIL (exit 1)** — ephemeral auth unavailable on production-linked env |
| Route navigation audit | `node --import tsx --test src/lib/__tests__/route-navigation-audit.test.ts` | **8/8 PASS** |
| Typecheck | `npx tsc --noEmit` | **PASS** |
| Production build | `npm run build` | **PASS** |
| YC / comms integration | `YIKE_DEV_DB_INTEGRATION=1 npm run test:dev:integration` | **NOT RE-RUN** — `verify:dev-target` resolves to production ref `hlpojfurfldvcxfxhveg`; prior 14/14 (2026-10-25) is evidence for RPC behavior on the linked DB only |

## Applicable test matrix (historical)

| Suite | Command | Result |
|-------|---------|--------|
| Consumer shell connectivity | `playwright test e2e/consumer-shell-connectivity.spec.ts` | 10/10 PASS (prior) |
| Full consumer Playwright (prod-linked `.env.local`) | `npx playwright test e2e/…` (excl. nav-only) | 30 PASS, 16 SKIP |
| YC / comms integration (prior session) | `YIKE_DEV_DB_INTEGRATION=1 npm run test:dev:integration` | 14/14 PASS on linked DB — **not** production migration readiness |

---

## Recommended next actions (ordered)

1. **Create isolated Supabase project** → `.env.e2e.local` → full migration apply (includes `261510`) → `YIKE_DEV_DB_INTEGRATION=1` on isolated ref → `npm run e2e:nav-prereqs:isolated` (exit 0) → `npm run test:e2e:navigation`.
2. **Production migration history alignment (ops)** — `npm run compare:migrations` + controlled repair; see `YC_WALLET_MIGRATION_RECONCILIATION.md`.
3. **Provision six Lex staff test users** on that project → re-run navigation suite including `staff-role-routes.spec.ts`.
4. **Paystack:** ops verification of keys, flags, webhook URL, one sandbox charge — when keys available.
5. **Final gate:** full Playwright on isolated env; update this doc with commit hashes and PASS/FAIL counts.

---

## References

- `docs/engineering/MARKETPLACE_E2E_AUDIT.md`
- `docs/engineering/YC_WALLET_MIGRATION_RECONCILIATION.md`
- `docs/engineering/ROUTE_NAVIGATION_AUDIT.md`
- `.env.e2e.example`
- `scripts/e2e-navigation-prerequisites.ts`
- `docs/engineering/PROJECT_IDENTITY.md` (production ref `hlpojfurfldvcxfxhveg`)
