# Transaction Audit Report

**Date:** 2026-07-24  
**SSOT table:** `public.payment_orders`  
**Canonical view:** `public.transactions` (after migration)

## Schema (post-migration)

| Field | Notes |
|-------|-------|
| `id` | UUID PK |
| `user_id` | Owner |
| `listing_id` | Nullable (backfilled from metadata) |
| `order_type` / purpose | Unified product enum |
| `amount` / `currency` | Server-set |
| `reference` | Unique Yike reference |
| `paystack_reference` | Gateway reference |
| `status` | pending → processing → successful \| failed \| cancelled \| refunded |
| `channel` / `fees` | From Paystack verify |
| `gateway` | Default paystack |
| `gateway_response` | Sanitized verify payload |
| `metadata` | Product ids + `fulfilled` marker |
| `entity_id` | Promotion / order entity |
| `paid_at`, `created_at`, `updated_at` | Timestamps |

## Purpose enum (unified products)

Launch / live paths:

- `featured_listing`, `boost_listing`, `subscription`, `property_verification`, `verification_fee`, `advertisement`, `lead_insights`

Reserved (future-ready, no launch UI):

- `listing_fee`, `premium_seller`, `vehicle_boost`, `property_boost`, `escrow_hold`, `wallet_topup`

## Status machine

```
pending ──initialize──► processing ──webhook verify──► successful ──fulfill──► product active
                │                              │
                └── fail / cancel ─────────────┴──► failed | cancelled
successful ──refund──► refunded
```

## Audit trail

- `logPaymentAudit` actions: created, initialized, success, failed, refunded, promotion_activated, subscription_activated
- `paystack_webhook_events` for delivery audit
- Admin UI: `/lex/auth/revenue/transactions`

## Migration

File: `supabase/migrations/20260724073250_payment_transactions_paystack_v1.sql`  
**Not applied in this session.** Apply after founder approval with project verify PASS.
