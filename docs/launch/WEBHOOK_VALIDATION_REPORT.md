# Webhook Validation Report

**Date:** 2026-07-24  
**Preferred URL:** `https://yike.ng/api/payments/webhook`  
**Legacy URL:** `https://yike.ng/api/webhooks/paystack`

## Flow

```
Paystack POST raw body
  → require PAYSTACK_SECRET_KEY configured (else 503)
  → verify x-paystack-signature via HMAC-SHA512(raw body, PAYSTACK_SECRET_KEY) (else 401)
  → parse JSON
  → insert paystack_webhook_events (dedupe by event_id / processed reference)
  → if charge.success:
       reconcileAndFulfillPayment(reference)
         → Paystack API verify
         → amount/currency check
         → mark successful (idempotent)
         → fulfill product
         → notify user
  → mark webhook event processed|failed
```

## Deduplication

- Unique `event_id` when present
- Unique processed `reference` (partial unique index)
- Duplicate deliveries return `{ ok: true, duplicate: true }` without re-fulfilling incorrectly (fulfill path itself is idempotent)

## Event handling

| Event | Action |
|-------|--------|
| `charge.success` | Verify + fulfill |
| Other `charge.*` | Record + mark processed (no fulfill) |
| Non-charge / missing reference | Record + mark processed |

## Paystack dashboard settings (founder)

1. **Webhook URL:** `https://yike.ng/api/payments/webhook`
2. Keep legacy URL only until dashboard cutover complete
3. **Callback URL:** `https://yike.ng/payments/callback`
4. Enable `charge.success` (minimum)

## Validation checklist

- [ ] Coolify has `PAYSTACK_SECRET_KEY` set (live or test consistently)
- [ ] Dashboard webhook URL points to preferred path
- [ ] Test charge → webhook 200 → transaction `successful` → product active
- [ ] Replay webhook → `duplicate: true`, no double activation
- [ ] Tampered signature → 401
- [ ] Callback alone with forged query params → Processing forever / no activation
