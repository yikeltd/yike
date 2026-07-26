# Paystack Integration Report

**Date:** 2026-07-24  
**Project:** Yike (`hlpojfurfldvcxfxhveg`)  
**Status:** Implemented for review — **not committed**  
**Supabase verify:** `npm run verify:supabase-project -- --require-linked` → **PASS**

## Summary

Extended the existing `payment_orders` + Paystack provider stack into a production-grade flow:

1. Server creates **Pending** transaction (unique reference)
2. Initialize Paystack → redirect to Checkout
3. Callback shows **Processing…** only (status poll — no activation)
4. Webhook verifies signature → verifies with Paystack API → marks **Successful** (idempotent) → activates product → notifies user

## Endpoints

| Method | Path | Role |
|--------|------|------|
| POST | `/api/payments/initialize` | Create + initialize checkout (server-priced) |
| GET | `/api/payments/verify/:reference` | Status poll only |
| GET/POST | `/api/payments/verify` | Legacy status poll (no activation) |
| POST | `/api/payments/webhook` | **Preferred** Paystack webhook |
| POST | `/api/webhooks/paystack` | Legacy webhook alias |
| GET | `/api/payments/history` | User transaction history |
| GET | `/api/payments/:reference` | User transaction detail |
| GET | `/api/admin/payments/transactions` | Staff transactions + summary |
| GET | `/api/admin/payments/webhooks` | Staff webhook audit |

## UX routes

| Path | Behavior |
|------|----------|
| `/payments/callback` | Processing + poll → redirect |
| `/payments/success` | Confirmed |
| `/payments/failed` | Failed |
| `/payments/cancelled` | Cancelled |
| `/payments/history` | User history |
| `/payments/verify` | Redirects to `/payments/callback` |

## Admin

- `/lex/auth/revenue/transactions` — transactions, revenue strip, webhook logs
- Nav: Revenue → Transactions

## Gateway abstraction

`PAYMENT_GATEWAY=paystack` (alias `PAYMENT_PROVIDER`)

Providers behind `PaymentProvider` interface:

- **paystack** — live
- **safehaven** — stubbed (existing)
- **flutterwave / monnify / stripe / wallet** — interface stubs

## Database

Migration file (not applied to prod in this task):

`supabase/migrations/20260724073250_payment_transactions_paystack_v1.sql`

- Extends `payment_orders` with `listing_id`, `paystack_reference`, `channel`, `fees`, `gateway`, `gateway_response`
- Expands purpose enum (escrow/wallet-ready)
- Creates `transactions` view (`security_invoker`) over `payment_orders`
- Code falls back if columns missing (safe pre-migration)

## Founder apply (when ready)

```bash
npm run verify:supabase-project -- --require-linked
# Then apply migration via SQL Editor or:
npm run db:push
```

## Existing product checkouts

Promote / subscription / verification / ads routes still create orders via `createPaymentOrder` + `initializePayment` — now use `/payments/callback` and webhook-only fulfillment.
