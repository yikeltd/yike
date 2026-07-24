# Phone Verification Flow Report

**Date:** 2026-07-24  
**End state:** Request OTP → **one** SMS → enter code → verify success  
**Commit:** **not committed** (pending review)

## Happy path (seller / listing gate)

```
UI (PhoneSmsVerificationPanel | SellerPhoneVerifyRow)
  → POST /api/profile/phone/send-code
  → normalize phone (08… → store local + 234… intl)
  → invalidate prior sent sessions for user+phone
  → generate 6-digit OTP + local hash ref
  → sendBrandedSmsOtp → Sendchamp POST /sms/send  (ONCE)
  → store session; return success + start 60s cooldown

UI enter code
  → POST /api/profile/phone/verify-code
  → latest sent session; trim code; hash compare
  → mark session verified; set phone_verified + phone_verified_at
  → success UI / redirect
```

## Auth signup SMS (same delivery function)

```
POST /api/auth/phone/send → sendPhoneOtp → generate → hashOtp(code) → sendBrandedSmsOtp
POST /api/auth/phone/verify → verifyOtpHash against phone_otp_requests
```

## Frontend guards

| Control | Implementation |
|---------|----------------|
| Disable Verify immediately | `verifying` state + `verifyLockRef` before fetch |
| Loading copy | “Sending…” / “Verifying…” |
| Ignore double-taps | refs + busy flags; mutual exclusion send↔verify |
| No concurrent requests | single in-flight per action |
| Resend cooldown | 60s client countdown + 60s server cooldown |

## SMS template

Exact single-line body from `SMS_OTP_MESSAGE_TEMPLATE` (see Sendchamp Integration Audit).

## Out of scope (unchanged)

- Email OTP
- WhatsApp Verification API delivery (non-SMS)
- New features / schema migrations

## Verdict

Flow matches required end state: one server send function, one SMS, local verify, profile updated on success.
