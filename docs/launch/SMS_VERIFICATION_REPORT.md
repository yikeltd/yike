# SMS Verification Report — Sendchamp Production OTP

**Date:** 2026-07-23  
**Status:** Implemented (hold commit — founder review)  
**Channel:** SMS (primary) · Sender `YIKE` · WhatsApp deferred

## Objective

Production phone verification for sellers via Sendchamp SMS OTP. Browse stays free after email verify; listing/selling requires phone verify.

## Architecture

```
Seller taps List → /auth/verify-phone
  → POST /api/profile/phone/send-code  (server only)
  → Sendchamp Verification API register (in_app_token) + branded SMS send
  → POST /api/profile/phone/verify-code
  → Sendchamp Verification API confirm
  → profiles.phone_verified = true (+ whatsapp_* timestamp fields)
  → continue to listing wizard
```

Channel abstraction lives in `src/lib/phone-verification/`:

| Module | Role |
|--------|------|
| `types.ts` | `PhoneVerificationProvider` interface (`sms` \| `whatsapp` \| `email`) |
| `provider.ts` | Sendchamp implementation (SMS now; WhatsApp stub) |
| `service.ts` | Auth’d seller send/verify + rate limits |
| `channel.ts` | Default channel = **sms** (`SENDCHAMP_OTP_CHANNEL`) |
| `copy.ts` | UX copy + approved SMS body template |

## Sendchamp config

| Setting | Value |
|---------|--------|
| Channel | `sms` |
| Sender | `YIKE` (`SENDCHAMP_SMS_SENDER`) |
| OTP | Numeric, 6 digits |
| Expiry | 30 minutes |
| Credentials | Env only: `SENDCHAMP_PUBLIC_KEY` / `SENDCHAMP_API_KEY` |

## SMS body (production)

```
Welcome to Yike, your verification code is {OTP}.

It's valid for 30 minutes.

Do not share it with anyone.

Happy listing.
```

Delivery: server generates OTP → registers with `/verification/create` (`in_app_token: true`) → sends branded copy via `/sms/send` → confirm via `/verification/confirm`.

## Flags (Coolify)

```
ENABLE_PHONE_OTP=true
ENABLE_SMS_OTP=true
ENABLE_WHATSAPP_OTP=false
NEXT_PUBLIC_ENABLE_PHONE_OTP=true
NEXT_PUBLIC_ENABLE_WHATSAPP_OTP=false
SENDCHAMP_OTP_CHANNEL=sms
SENDCHAMP_SMS_SENDER=YIKE
SENDCHAMP_OTP_EXPIRY_MINUTES=30
SENDCHAMP_OTP_LENGTH=6
```

## How to test (no live SMS without keys)

1. Set Sendchamp keys in `.env.local` (never commit).
2. `npm run dev` → sign in → open `/auth/verify-phone`.
3. Send code → check phone SMS (or Sendchamp dashboard logs).
4. Dry-run without keys: APIs return 503 “could not send SMS” — no client secrets.
5. Ops: `node --env-file=.env.local scripts/test-sendchamp.mjs` / `scripts/verify-otp-production.mjs`.

## Files (core)

- `src/lib/phone-verification/**`
- `src/lib/notifications/providers/sendchamp-verification.ts`
- `src/lib/notifications/providers/sendchamp.ts`
- `src/app/api/profile/phone/send-code/route.ts`
- `src/app/api/profile/phone/verify-code/route.ts`
- `src/components/profile/phone-sms-verification-panel.tsx`
- `src/app/auth/verify-phone/**`
