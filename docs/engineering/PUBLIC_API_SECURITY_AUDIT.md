# Public & sensitive API security audit

**Branch:** `feat/unified-three-vertical-marketplace`  
**Updated:** 2026-10-26 (upload / forward / passport / metrics slice)  
**Scope:** Route-level authZ, IDOR, identity spoofing, unsafe mutations (static review + targeted fixes)

This is **not** a claim of full production readiness. Database RLS/RPC grants were spot-checked only where routes use service role.

---

## Fixed in this branch (with regression tests)

| Route | Issue | Fix | Tests |
|-------|-------|-----|-------|
| `GET /api/listings/[id]/seller-contact` | Client `sellerId` not bound to listing | `assetType` + `resolveListingSeller` → 404 mismatch | `seller-contact-route.test.ts` |
| `POST /api/listing-leads/capture` | Client `sellerId` / display identity | `validateListingLeadCaptureRequest`, session `leadUserId` | `listing-leads-capture-route.test.ts`, E2E auth spec |
| `GET /api/revenue/entitlements/[userId]` | Unauthenticated read of any `userId` | Session required; `userId` must equal session user | `public-listing-target.test.ts` (static) |
| `POST /api/properties/[id]/view` | Metrics RPC for arbitrary UUIDs | `isApprovedListingForPublicMetrics` → 404 | `public-listing-target.test.ts` (static) |
| `POST /api/properties/[id]/contact-click` | Same | Same | Same |
| `POST /api/analytics/listing-event` | Events for non-live listings | Same guard before `logListingEvent` | Same |
| `POST /api/leads/forward` | Repeat calls inflated agent `successful_handoffs`; weak ref parsing | `isValidLeadReference`; skip side effects when handoff already shared | `api-security-slice-20261026.test.ts` |
| `GET /api/trust/passport/[userId]` | Public stub passport for any UUID | `passport_ui` launch gate → 404; UUID validation | Same |

---

## Reviewed — acceptable or low prod risk

| Route / area | Auth | Notes |
|--------------|------|-------|
| `POST /api/leads/track` | Public | Uses `validateLeadRequest` (listing/agent binding) |
| `POST /api/leads/forward` | Public | Idempotent handoff after first share; `YK-XXXXXX` format required |
| `POST /api/media/upload` | Session + lister role | `resolveStoragePropertyId` — draft scoped per user; UUID listing requires `agent_id` match (staff override) |
| `POST /api/leads/call-opened` | Public | Reference format validated (no DB write on invalid ref) |
| `POST /api/social/follow` | Session | Follower from session |
| `GET/POST /api/agent/listing-leads` | Session | Seller-scoped updates (`seller_id`) |
| `GET/POST /api/conversations/*`, messages | Session | Participant checks in service layer |
| `POST /api/payments/reconcile` | Session | Order `user_id` match |
| `POST /api/admin/yike-coins/grant` | Staff | `requireSuperAdminApi` |
| YC transfer / balance / ledger | Session | Actor from session |
| `PATCH /api/account/username` | Session | User-bound |
| `POST /api/dev/yike-coins/test-credit` | Dev gate | Blocked in production |

---

## Reviewed — intentional public / product gaps (no code change this slice)

| Route | Risk class | Notes |
|-------|------------|-------|
| `GET /api/trust/passport/[userId]` | Product / launch | **Gated** — 404 unless `passport_ui` visible (in-memory stub when enabled) |
| `GET /api/revenue/entitlements/*` (pre-fix) | IDOR | **Fixed** — was in-memory stub but pattern was unsafe for real store |
| View/contact-click (pre-fix) | Metric inflation | **Fixed** — not IDOR; prevented junk increments on invalid/hidden listings |
| ~300+ admin/Lex routes | Staff | Assumed middleware + `requireStaff*` — **not fully enumerated** |

---

## Not audited / blocked

- Full Lex `/api/admin/*` and `/api/lex/*` matrix
- Storage RLS policies on buckets (route-level ownership reviewed for `POST /api/media/upload`; admin signed URLs staff-only)
- Paystack webhook (see `PAYSTACK_READINESS_AUDIT.md`)
- Vehicle/electronics parallel metrics routes — **none found**; public metrics use `properties` SSOT only (`api-security-slice-20261026.test.ts`)
- RPC grant matrix on production (read-only SQL recommended)
- Rate limiting consistency across public POST endpoints

---

## Test commands (this audit)

```bash
node --test src/lib/__tests__/public-listing-target.test.ts
node --test src/lib/__tests__/seller-contact-route.test.ts
node --test src/lib/__tests__/listing-leads-capture-route.test.ts
npx tsx --test src/lib/__tests__/api-security-slice-20261026.test.ts
```

Integration tests against Supabase: **not run** when local env resolves to production project ref.

---

## External prerequisites (unchanged)

1. Isolated Supabase + `.env.e2e.local` for authenticated E2E (16 skips).
2. Six Lex `E2E_STAFF_*` staff test accounts.
3. Migration history alignment approval (`MIGRATION_HISTORY_EXPORT.md`, `YC_WALLET_MIGRATION_RECONCILIATION.md`) — no prod `db push`.
4. Paystack live keys, webhook, checkout verification.
