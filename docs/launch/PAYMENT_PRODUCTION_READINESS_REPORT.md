# Production Readiness Report — Paystack Payments

**Date:** 2026-07-24  
**Commit:** **NONE** (held for founder review)  
**Overall:** Ready to review / configure; migration apply + Coolify env required before live charges

## Go / No-Go

| Gate | Status |
|------|--------|
| Webhook + Paystack verify is source of truth | **GO** |
| Callback does not activate | **GO** |
| Verify poll does not activate | **GO** |
| Gateway abstraction | **GO** (stubs for future) |
| Admin transactions + webhook logs | **GO** |
| Migration created + verify PASS | **GO** (file only) |
| Migration applied to production | **NO-GO** until founder applies |
| Coolify env + Paystack dashboard URLs | **NO-GO** until set |
| `ENABLE_FEATURED_PAYMENTS=true` with live keys | Founder decision |

## Coolify env keys (placeholders — no secrets)

```
PAYSTACK_SECRET_KEY=
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=
PAYSTACK_CALLBACK_URL=https://yike.ng/payments/callback
PAYSTACK_WEBHOOK_URL=https://yike.ng/api/payments/webhook
PAYSTACK_BASE_URL=https://api.paystack.co
PAYMENT_CURRENCY=NGN
PAYMENT_GATEWAY=paystack
PAYMENT_PROVIDER=paystack
ENABLE_FEATURED_PAYMENTS=true
NEXT_PUBLIC_SITE_URL=https://yike.ng
```

## Paystack dashboard URLs to set

| Setting | Value |
|---------|--------|
| Callback URL | `https://yike.ng/payments/callback` |
| Webhook URL | `https://yike.ng/api/payments/webhook` |
| Legacy webhook (optional during cutover) | `https://yike.ng/api/webhooks/paystack` |

## Pre-launch smoke

1. Apply migration on `hlpojfurfldvcxfxhveg`
2. Set Coolify env (test keys first)
3. Paystack test charge on featured/boost
4. Confirm webhook 200 + transaction successful + listing promoted
5. Confirm callback never activates alone (disable webhook briefly → stays Processing)
6. Replay webhook → no double boost
7. Check `/payments/history` + `/lex/auth/revenue/transactions`

## Related reports

1. `docs/launch/PAYSTACK_INTEGRATION_REPORT.md`
2. `docs/launch/PAYMENT_SECURITY_AUDIT.md`
3. `docs/launch/WEBHOOK_VALIDATION_REPORT.md`
4. `docs/launch/TRANSACTION_AUDIT_REPORT.md`
5. This file
