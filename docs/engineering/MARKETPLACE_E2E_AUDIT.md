# Marketplace end-to-end audit

**Branch:** `feat/unified-three-vertical-marketplace`  
**Updated:** 2026-10-26  
**HEAD baseline:** post `e9b3e78e` (peer-transfer migration repair)

This audit distinguishes **Playwright smoke/navigation** (anonymous, production-linked local dev) from **authenticated seller/create/messaging** flows (blocked without isolated Supabase).

---

## Journey coverage matrix

| Journey | Automated coverage | Status | Notes |
|---------|-------------------|--------|-------|
| Public home, tabs (property/vehicle/electronics) | `marketplace-routes-smoke.spec.ts` | **PASS** | Three vertical tabs + electronics filters |
| Search `/search?marketplace=all` | `unified-search-integration`, `marketplace-browse-navigation` | **PASS** | Mixed marketplace loads |
| Vehicle browse `/vehicles?category=…` | `unified-search-integration` | **PASS** | HTTP 2xx |
| Listing detail + browseReturn back nav | `marketplace-browse-navigation` | **PASS** | Requires live listings in feed |
| Discover + mobile bottom nav | `discover-navigation`, `consumer-shell-connectivity` | **PASS** | |
| Unified search bar scroll (mobile) | `unified-search-integration` | **PASS** | Not sticky |
| Seller routes gated (unauthenticated) | `seller-journey-gates.spec.ts` | **PASS** | Login `next=` preserved; open redirect blocked |
| Wallet / messages / thread gate | `consumer-shell-connectivity.spec.ts` | **PASS** | Redirect or home when messaging off |
| 320px bottom nav | `consumer-shell-connectivity.spec.ts` | **PASS** | |
| Registration / OTP / PIN | `signup-form-hardening`, `email-otp-resend`, `pin-login-*` | **Partial** | Not re-run in this slice |
| Authenticated seller choose + create + publish | — | **BLOCKED** | No isolated Supabase / E2E creds |
| Listing photo upload E2E | — | **BLOCKED** | Requires auth + storage |
| In-app messaging send/receive | `conversation-thread-navigation` | **BLOCKED** (16 skips suite-wide) | Ephemeral auth |
| Paystack / YC checkout | — | **BLOCKED** | Flags + keys |

---

## Static / unit verification (2026-10-26)

| Suite | Result |
|-------|--------|
| Marketplace Playwright (6 specs, 32 tests) | **32 PASS**, 0 FAIL, 0 SKIP |
| Listing create / seller routes unit bundle | **34 PASS** |
| Route navigation audit | **8 PASS** (run with typecheck slice) |
| `seller-contact-route.test.ts` | Added with listing–seller binding guard |

---

## Defect fixed (security)

**Issue:** `GET /api/listings/[id]/seller-contact` accepted arbitrary `sellerId` for any authenticated buyer, allowing phone entitlement probes without proving the seller owns the listing.

**Fix:** Require `assetType`; use `resolveListingSeller()`; return **404** when `sellerId` does not match listing `agent_id`. UI updated to pass `assetType` (property/vehicle/electronics components).

**Commit:** (see release blocker report after push)

---

## API / auth spot-check (read-only)

| Area | Finding |
|------|---------|
| `POST /api/agent/listings/create` | `getUser`, role gate, idempotency, cross-vertical reject |
| `PATCH …/lifecycle` | `agent_id` ownership on update |
| `POST /api/conversations` | Auth + `resolveListingSeller` |
| `GET/POST …/messages` | Auth + service-layer forbidden/not_found |
| `POST /api/listing-leads/capture` | Anonymous allowed; lead attribution only (no PII phone reveal) |

---

## Remaining blockers

1. Isolated Supabase + `.env.e2e.local` for authenticated seller + messaging E2E.
2. Production migration history alignment (`YC_WALLET_MIGRATION_RECONCILIATION.md`).
3. Paystack live verification.

---

## Commands (repeat audit)

```bash
PLAYWRIGHT_SKIP_SERVER=1 npx playwright test \
  e2e/marketplace-routes-smoke.spec.ts \
  e2e/marketplace-browse-navigation.spec.ts \
  e2e/seller-journey-gates.spec.ts \
  e2e/unified-search-integration.spec.ts \
  e2e/discover-navigation.spec.ts \
  e2e/consumer-shell-connectivity.spec.ts

node --import tsx --test src/lib/__tests__/listing-create-api-contract.test.ts \
  src/lib/__tests__/listing-create-routes-handlers.test.ts \
  src/lib/__tests__/seller-listing-routes.test.ts \
  src/lib/__tests__/seller-contact-route.test.ts
```
