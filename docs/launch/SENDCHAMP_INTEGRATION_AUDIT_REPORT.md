# Sendchamp Integration Audit Report

**Date:** 2026-07-24  
**Scope:** Phone SMS OTP delivery paths (P0 launch hotfix)  
**Commit:** **not committed** (pending review)

## Root cause (duplicate SMS)

Production SMS OTP previously called **two** Sendchamp endpoints per request:

| # | Call | Template |
|---|------|----------|
| 1 | `POST /verification/create` (`createSendchampVerificationOtp`, even with `in_app_token: true`) | Sendchamp default **“Hi There, Your OTP is …”** |
| 2 | `POST /sms/send` (`sendBrandedSmsOtp`) | Multi-line Yike branded body |

That matches the reported two-SMS failure mode.

## Call-site inventory (after fix)

### SMS delivery — **one** function

| Function | File | Endpoint | Used by |
|----------|------|----------|---------|
| `sendBrandedSmsOtp` | `src/lib/notifications/providers/sendchamp.ts` | `/sms/send` only | Seller phone OTP provider, auth `sendPhoneOtp` SMS path, `sendOtpSms` / `deliverOtp` |
| `sendOtpSms` | same | delegates to `sendBrandedSmsOtp` | `deliverOtp` |

No other production path calls `/sms/send`.

### `/verification/create` — **not used for SMS delivery**

| Caller | Channel | Purpose |
|--------|---------|---------|
| `otp/service.ts` WhatsApp signup branch | `whatsapp` | WhatsApp OTP delivery |
| `phone-verification/provider.ts` WhatsApp branch | `whatsapp` | Future WA channel |
| `createSendchampWhatsappVerification` | forced `whatsapp` | Profile WhatsApp verify |
| `sendVerificationOtp` in `sendchamp.ts` | WhatsApp only | WA fallback + diagnostics |

**Guard:** `createSendchampVerificationOtp` rejects `channel: "sms"` unless `inAppToken: true`. SMS delivery via Verification API is disabled.

**Diagnostics:** `runSendchampDiagnostics` no longer probes Verification API with SMS (would send “Hi There”).

## SMS body (exact)

```
Your verification code is: {OTP}. Code is valid for 30 minutes. Never share this code. Welcome to Yike. Happy Listing.
```

Defined in `SMS_OTP_MESSAGE_TEMPLATE` / `buildSmsOtpMessage` (`src/lib/phone-verification/copy.ts`). Single line, plain text.

## Frontend → Sendchamp

Frontend never calls Sendchamp. All SMS goes through:

- `POST /api/profile/phone/send-code` → `sendSellerPhoneVerificationCode` → `sendBrandedSmsOtp`
- `POST /api/auth/phone/send` → `sendPhoneOtp` → `sendBrandedSmsOtp` (SMS)

## Verdict

**One** SMS send path remains for production phone OTP. Verification API SMS delivery is blocked.
