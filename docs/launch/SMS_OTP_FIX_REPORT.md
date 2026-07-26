# Fix Report — OTP SMS Charge / No-Delivery

**Date:** 2026-07-26  
**Commit status:** **Not committed — awaiting founder review**

## Changes (local working tree)

### 1. Single billable path per tap

- Seller + auth SMS: **only** `POST /verification/create` with `in_app_token: false`, sender `YIKE`
- **Removed** in-request fallback to `/sms/send`
- Confirm via `/verification/confirm`

### 2. No timeout retries on billable POSTs

- Billable requests: one API key, one attempt
- Timeout / network error → fail closed (no second charge)

### 3. No multi-route SMS spray

- Branded `/sms/send` (diagnostics only): **one** route (`SENDCHAMP_SMS_ROUTE` first value or `dnd`)

### 4. Narrow custom-message retry

- Retry without `meta_data.message` only if error matches message-template language — not generic `invalid`

### 5. Missing reference after HTTP success

- Fail closed — **do not** call `/sms/send` (may already be charged)

### 6. Structured audit logging (temporary)

- `src/lib/otp/delivery-audit.ts`
- Coolify: search `[otp-audit]`
- Default `OTP_DELIVERY_AUDIT` on; set `OTP_DELIVERY_AUDIT_REDACT=true` to hash phones

## Files touched

- `src/lib/otp/delivery-audit.ts` (new)
- `src/lib/notifications/providers/sendchamp-verification.ts`
- `src/lib/notifications/providers/sendchamp.ts`
- `src/lib/phone-verification/provider.ts`
- `src/lib/phone-verification/service.ts`
- `src/lib/phone-verification/types.ts`
- `src/lib/otp/service.ts`
- `.env.example`
- Reports under `docs/launch/`

## Validation

- `npx tsc --noEmit` — pass
- Live SMS smoke — **pending** after Coolify deploy of reviewed commit

## Post-review deploy checklist

1. Founder approves → commit + push `main`
2. Coolify Ready
3. One tap Send code on a real number
4. Confirm Coolify shows **one** `[otp-audit]` `sendchamp_http_response` for `/verification/create`
5. Confirm Sendchamp dashboard shows **one** OTP SMS debit
6. Confirm handset receives SMS
7. Confirm verify succeeds
8. After 24h clean: set `OTP_DELIVERY_AUDIT=false` or redact

## Intentionally not in this fix

- Distributed lock across Coolify replicas (follow-up)
- Changing Sendchamp wallet / DND commercial settings (dashboard)
