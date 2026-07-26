# Payment Security Audit

**Date:** 2026-07-24  
**Scope:** Paystack checkout, verify, webhook, fulfillment  
**Verdict:** Hardened for production review

## Critical rule (enforced)

**Never credit/activate based on callback URL alone.**

| Surface | Trust level | Activation? |
|---------|-------------|-------------|
| Callback `/payments/callback` | Untrusted | **No** — Processing UI + status poll only |
| `GET /api/payments/verify/*` | Untrusted (auth for ownership) | **No** — DB status only |
| Webhook `/api/payments/webhook` | Signature required | **Yes** — after Paystack API verify |
| Client `amount` / `status` / `reference` | Untrusted | **Ignored** — server generates reference & prices |

## Controls

1. **Secret key** — `PAYSTACK_SECRET_KEY` server-only; public key is `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` only
2. **Webhook signature** — HMAC-SHA512(raw body, `PAYSTACK_SECRET_KEY`) + `x-paystack-signature` header; `timingSafeEqual`; missing/invalid → **401** (no separate webhook secret)
3. **Gateway verify** — `GET /transaction/verify/:reference` before SUCCESS
4. **Amount match** — paid vs order amount (±0.01); mismatch → Failed
5. **Currency match** — paid vs order currency
6. **Idempotent SUCCESS** — update only from `pending|processing` → `successful`
7. **Unique references** — `crypto.randomBytes` server-side (`generatePaymentReference`)
8. **Initialize catalog** — strips client `amount`; prices from featured/boost services
9. **Sanitized gateway_response** — strips card authorization payloads
10. **RLS** — users select own `payment_orders`; webhooks staff-only; service role for webhook path

## Residual risks / ops

| Risk | Mitigation |
|------|------------|
| Webhook delayed | Callback stays on Processing; user notified by email on fulfill |
| Fulfill fails after SUCCESS | Webhook event marked `failed`; staff retry via reconcile path / admin review |
| Migration not applied | Code falls back without new columns; apply migration before go-live |
| `ENABLE_FEATURED_PAYMENTS=false` | Initialize returns 503 — keep flag + keys aligned in Coolify |

## Not in scope (deferred)

- Refunds via Paystack API (status `refunded` supported in DB)
- Escrow / wallet ledger (purposes reserved only)
- Multi-gateway live routing
