# Production Readiness Report — Sendchamp SMS Phone OTP

**Date:** 2026-07-23  
**Verdict:** **Ready after credential rotation + Coolify env** (code complete; hold commit pending review)

## Checklist

| Item | Status |
|------|--------|
| SMS default channel (not WhatsApp) | Done |
| Sender `YIKE`, 6-digit, 30 min | Done |
| Branded SMS copy | Done |
| Verification API confirm | Done |
| Seller UX `/auth/verify-phone` | Done |
| Listing gate phone required | Done |
| Channel abstraction for future WA/email | Done |
| Env-only credentials | Done |
| `tsc --noEmit` | Pass |
| Live SMS end-to-end | Blocked until rotated keys in Coolify |
| Git commit | **Not committed** (per request) |

## Coolify env (production)

```
SENDCHAMP_PUBLIC_KEY=<rotated key>
SENDCHAMP_LIVE_BASE_URL=https://api.sendchamp.com/api/v1
SENDCHAMP_SMS_SENDER=YIKE
SENDCHAMP_OTP_CHANNEL=sms
SENDCHAMP_OTP_EXPIRY_MINUTES=30
SENDCHAMP_OTP_LENGTH=6
ENABLE_PHONE_OTP=true
ENABLE_SMS_OTP=true
ENABLE_WHATSAPP_OTP=false
NEXT_PUBLIC_ENABLE_PHONE_OTP=true
NEXT_PUBLIC_ENABLE_WHATSAPP_OTP=false
```

Optional: `SENDCHAMP_WEBHOOK_SECRET`, `YIKE_OTP_SERVER_TOKEN` (existing OTP DB RPC).

## Post-deploy smoke

1. Sign in with email-verified account that has `phone_verified=false`.
2. Open `/agent/listings/new` → redirected to `/auth/verify-phone`.
3. Send SMS → receive Yike branded OTP from sender **YIKE**.
4. Verify → redirected to listing form; `phone_verified` true in profile.
5. Confirm browse/search still works without phone on a second account.

## Rollback

Set `ENABLE_PHONE_OTP=false` (and matching `NEXT_PUBLIC_`) in Coolify → redeploy. Listing create will fail closed until phone OTP is re-enabled — prefer fixing Sendchamp over leaving phone gate off in production.

## Related docs

- [SMS_VERIFICATION_REPORT.md](./SMS_VERIFICATION_REPORT.md)
- [OTP_VALIDATION_REPORT.md](./OTP_VALIDATION_REPORT.md)
- [SELLER_VERIFICATION_GATE_REPORT.md](./SELLER_VERIFICATION_GATE_REPORT.md)
- [SENDCHAMP_SMS_OTP_SECURITY_REVIEW.md](./SENDCHAMP_SMS_OTP_SECURITY_REVIEW.md)
