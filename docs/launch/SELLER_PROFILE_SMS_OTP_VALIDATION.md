# SMS OTP Validation Report — Seller Onboarding v1

**Date:** 2026-07-23  
**Provider:** Sendchamp · Sender **YIKE** · Channel SMS  
**Status:** Reuses production phone-verification module — **hold commit**

## Flow (seller verify page)

1. User taps **Verify** beside phone → `POST /api/profile/phone/send-code`  
2. Server generates OTP; Sendchamp Verification API registers token; branded SMS delivered  
3. Same-row **Verification Code** + **Verify Code** → `POST /api/profile/phone/verify-code`  
4. On success: hide code UI; show **✓ Phone Number Verified** + timestamp; phone read-only  

## Policy (unchanged)

| Control | Value |
|---------|-------|
| Digits | 6 |
| Expiry | 30 minutes (`SENDCHAMP_OTP_EXPIRY_MINUTES` default 30) |
| Resend cooldown | 60s |
| Max sends / phone / hour | 3 |
| Max verify attempts / session | 5 |
| OTP source | Server-only (`generateOtp`) — never client-supplied |
| Credential exposure | None in UI or responses |

## Persistence

`verifySellerPhoneCode` now also sets `profiles.phone_verified_at` (migration adds column).

## Standalone route

`/auth/verify-phone` remains for deep links; listing entry points prefer `/agent/verify` so sellers never leave onboarding.

## Flags

`ENABLE_PHONE_OTP=true` · `ENABLE_SMS_OTP=true` · `SENDCHAMP_OTP_CHANNEL=sms` · `SENDCHAMP_SMS_SENDER=YIKE`
