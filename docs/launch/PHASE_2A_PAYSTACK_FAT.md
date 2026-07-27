# Phase 2A — Paystack FAT Checklist

**Status:** Code-certified 2026-07-26 · Live production enablement = ops (Coolify)  
**Authority:** Enterprise Activation Program Phase 2 · Financial Payment module  
**Do not flip** `ENABLE_PAYMENTS` / `ENABLE_FEATURED_PAYMENTS` until every box below is green.

## Pre-flight (Coolify)

- [ ] `PAYSTACK_SECRET_KEY` set (test or live — match Dashboard mode)
- [ ] `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` set
- [ ] `YIKE_PIN_PEPPER` set (≥32 chars) — already certified
- [ ] Paystack Dashboard webhook URL = `https://yike.ng/api/payments/webhook`
- [ ] Legacy `/api/webhooks/paystack` still works as alias (optional)

## Automated (CI / local)

```bash
npm run test:payments
npm run test:yip
```

Covers: HMAC signature accept/reject, flag+secret runtime gate, webhook event idempotency.

## Live FAT (founder / ops)

1. [ ] With flags **off**, `POST /api/payments/initialize` returns **503**
2. [ ] Set `ENABLE_PAYMENTS=true` (or `ENABLE_FEATURED_PAYMENTS=true`) in Coolify and restart
3. [ ] Init checkout for featured/promote → Paystack hosted page opens
4. [ ] Complete test charge → webhook **200** → order `successful` → product active
5. [ ] Replay identical webhook → `{ duplicate: true }` · **no** double activation
6. [ ] Tampered `x-paystack-signature` → **401**
7. [ ] Callback URL alone does **not** activate entitlement
8. [ ] Launch Health / Lex shows payment + ledger trail for the reference

## Settlement smoke (2A)

- [ ] `recordFinancialEvent` / durable ledger row present for successful charge
- [ ] Settlement **module** remains framework-only (`ENABLE_SETTLEMENT` off) — out of 2A scope

## Sign-off

| Role | Sign | Date |
|------|------|------|
| Engineering (code + tests) | Auto / Cursor | 2026-07-26 |
| Founder (live FAT) | ________ | ________ |

After live FAT: update [PLATFORM_ACTIVATION_REPORT.md](./PLATFORM_ACTIVATION_REPORT.md) Payment module → Production and clear “Featured payments live” disabled reason.
