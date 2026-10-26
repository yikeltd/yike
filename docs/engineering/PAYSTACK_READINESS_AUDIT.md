# Paystack readiness (code-level)

**Updated:** 2026-10-26  
**Live checkout / webhook E2E:** **BLOCKED** until `PAYSTACK_SECRET_KEY`, dashboard webhook URL, and `ENABLE_PAYMENTS` are authorized in production.

---

## Verified in repository (no live charges)

| Control | Implementation | Tests |
|---------|----------------|-------|
| Webhook HMAC-SHA512 | `paystackProvider.verifyWebhookSignature` on **raw body** before JSON parse | `paystack-signature.test.ts` (4) |
| Reject unsigned/tampered | `processPaystackWebhookPost` → **401** `invalid_signature` | Static guard test |
| Event idempotency | `recordPaystackWebhookEvent` by `event_id` / processed reference | `paystack-webhook-record.test.ts` (3) |
| Fulfillment source of truth | `reconcileAndFulfillPayment` after `charge.success` (not callback URL alone) | Service layer + webhook handler comments |
| Feature flags | `ENABLE_PAYMENTS` / `ENABLE_FEATURED_PAYMENTS`; module health when off | `flags-runtime.test.ts` |
| Entry routes | `/api/payments/webhook`, legacy `/api/webhooks/paystack` | Route files delegate to financial platform |

**Unit run (2026-10-26):** 11/11 PASS in Paystack-related payment tests.

---

## Ops checklist (when authorized)

1. Paystack dashboard webhook → `https://yike.ng/api/payments/webhook` (migrate off legacy path when ready).
2. Production `PAYSTACK_SECRET_KEY` in Coolify; `ENABLE_PAYMENTS=true` only when launch-approved.
3. Sandbox `charge.success` replay → expect `{ ok: true, duplicate: false }` once; duplicate delivery → `duplicate: true`.
4. Failed signature → **401**, no ledger mutation.

---

## References

- `src/lib/payments/webhooks/paystack.ts`
- `src/lib/payments/providers/paystack.ts`
- `src/lib/payments/config.ts`
