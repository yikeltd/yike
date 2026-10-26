# Marketplace end-to-end audit

**Branch:** `feat/unified-three-vertical-marketplace`  
**Updated:** 2026-10-26  
**HEAD baseline:** `4357e248` (listing-leads capture binding)

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
| Marketplace Playwright (7 specs, 35 tests) | **35 PASS**, 0 FAIL, 0 SKIP (`npm run test:e2e:marketplace`) |
| Listing create / seller routes unit bundle | **34 PASS** |
| Route navigation audit | **8 PASS** (run with typecheck slice) |
| `seller-contact-route.test.ts` | Added with listing–seller binding guard |

---

## Defects fixed (security)

### Seller contact (`4e90fb99`)

**Issue:** `GET /api/listings/[id]/seller-contact` accepted arbitrary `sellerId` for any authenticated buyer.

**Fix:** Require `assetType`; `resolveListingSeller()`; **404** on mismatch. UI passes `assetType`.

### Listing leads capture (this slice)

**Issue:** `POST /api/listing-leads/capture` trusted client `sellerId` (and optional `listingId`) with no server binding — forged leads could attribute to the wrong seller or ineligible listings.

**Fix:** `validateListingLeadCaptureRequest()` — listing-bound types use `validateLeadRequest()` (agent/listing match, eligibility); optional `assetType` cross-check; `follow` validates profile only; `leadUserId` from session only; ignore client `leadUserDisplay` when signed in.

**Tests:** `listing-leads-capture-route.test.ts` (2); `e2e/listing-leads-capture-auth.spec.ts` (3 API, read-only validation).

---

## API / auth spot-check (read-only)

| Area | Finding |
|------|---------|
| `POST /api/agent/listings/create` | `getUser`, role gate, idempotency, cross-vertical reject |
| `PATCH …/lifecycle` | `agent_id` ownership on update |
| `POST /api/conversations` | Auth + `resolveListingSeller` |
| `GET/POST …/messages` | Auth + service-layer forbidden/not_found |
| `POST /api/listing-leads/capture` | Listing-bound leads validated via `validateLeadRequest`; session user for `lead_user_id` |

---

## Remaining blockers

1. Isolated Supabase + `.env.e2e.local` for authenticated seller + messaging E2E.
2. Production migration history alignment (`YC_WALLET_MIGRATION_RECONCILIATION.md`).
3. Paystack live verification.

---

## Commands (repeat audit)

```bash
npm run test:e2e:marketplace

node --import tsx --test src/lib/__tests__/listing-create-api-contract.test.ts \
  src/lib/__tests__/listing-create-routes-handlers.test.ts \
  src/lib/__tests__/seller-listing-routes.test.ts \
  src/lib/__tests__/seller-contact-route.test.ts
```
