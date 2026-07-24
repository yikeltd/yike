# Production Readiness Report — Phone SMS OTP Hotfix

**Date:** 2026-07-24  
**Verdict:** **Code ready for review / deploy after live SMS smoke**  
**Git commit:** **None — do not commit until reviewed** (per task)

## Checklist

| Item | Status |
|------|--------|
| Duplicate SMS eliminated (Verification API + SMS API) | Done — SMS uses `/sms/send` only |
| Exact single-line SMS template | Done |
| Local OTP hash generate/store/verify aligned | Done |
| Prior OTP invalidated on resend (seller) | Done |
| Phone normalize consistent (`08…` ↔ `234…`) | Done |
| Frontend double-tap / loading / cooldown | Done |
| No OTP value in production logs | Done |
| `npx tsc --noEmit` | Pass |
| Live SMS end-to-end on production numbers | Pending after deploy |
| Git commit / push | **Held** |

## Files touched (review focus)

- `src/lib/phone-verification/copy.ts` — template
- `src/lib/phone-verification/local-otp.ts` — local hash refs (new)
- `src/lib/phone-verification/provider.ts` — SMS = branded send only
- `src/lib/phone-verification/service.ts` — invalidate prior; verify logging
- `src/lib/otp/service.ts` — auth SMS path + verify
- `src/lib/otp/crypto.ts` — full 6-digit `randomInt` range
- `src/lib/notifications/providers/sendchamp.ts` — no SMS Verification probe
- `src/lib/notifications/providers/sendchamp-verification.ts` — block SMS delivery via Verification API
- `src/components/profile/phone-sms-verification-panel.tsx`
- `src/components/agent/seller-phone-verify-row.tsx`

## Coolify env (unchanged requirements)

```
SENDCHAMP_PUBLIC_KEY=<key>
SENDCHAMP_LIVE_BASE_URL=https://api.sendchamp.com/api/v1
SENDCHAMP_SMS_SENDER=YIKE
SENDCHAMP_OTP_CHANNEL=sms
SENDCHAMP_OTP_EXPIRY_MINUTES=30
SENDCHAMP_OTP_LENGTH=6
ENABLE_PHONE_OTP=true
ENABLE_SMS_OTP=true
ENABLE_WHATSAPP_OTP=false
NEXT_PUBLIC_ENABLE_PHONE_OTP=true
YIKE_OTP_SERVER_TOKEN=<existing>
```

## Post-deploy smoke

1. Request seller phone OTP once → **exactly one** SMS with the exact template (no “Hi There”).
2. Enter that code → verify success; `phone_verified` true.
3. Double-tap Verify → single request; button stays disabled while verifying.
4. Resend within 60s → cooldown; after cooldown → new SMS; old code invalid.
5. Auth `/api/auth/phone/send` + verify with same normalization if used in signup.

## Rollback

Revert this change set or set `ENABLE_PHONE_OTP=false` / `ENABLE_SMS_OTP=false` in Coolify (listing gate fails closed — prefer fix over long disable).

## Related reports

- [SENDCHAMP_INTEGRATION_AUDIT_REPORT.md](./SENDCHAMP_INTEGRATION_AUDIT_REPORT.md)
- [OTP_GENERATION_AUDIT_REPORT.md](./OTP_GENERATION_AUDIT_REPORT.md)
- [OTP_VERIFICATION_AUDIT_REPORT.md](./OTP_VERIFICATION_AUDIT_REPORT.md)
- [PHONE_VERIFICATION_FLOW_REPORT.md](./PHONE_VERIFICATION_FLOW_REPORT.md)
