# Authentication Validation Report — Seller Phone OTP

**Date:** 2026-07-23  
**Status:** Code-validated · **no commit** (founder review)  
**tsc:** Pass

## Scope

Seller phone SMS OTP used by `/agent/verify` and `/auth/verify-phone` (shared panel / APIs).

## Checks

| Check | Result |
|-------|--------|
| Auth required for send/verify | Pass — 401 without session |
| OTP never generated on client | Pass — server `generateOtp()` only |
| Channel SMS (production) | Pass — `channel: "sms"`, `SENDCHAMP_OTP_CHANNEL=sms` |
| Confirm via Sendchamp | Pass — `/verification/confirm` with stored reference |
| Reject `pending:` claim refs | Pass — verify ignores unfinished claims |
| Success → `phone_verified` | Pass — hard fail if profile update fails |
| Email still required for `/agent/verify` | Pass — redirect `/auth/verify-email` |
| Seller profile POST requires phone | Pass — `isPhoneVerifiedForSeller` + code `phone_verification_required` |
| Consent required | Pass — client + API |

## API surface

| Route | Role |
|-------|------|
| `POST /api/profile/phone/send-code` | Authenticated seller/profile SMS send |
| `POST /api/profile/phone/verify-code` | Confirm OTP + mark profile verified |
| `POST /api/agent/seller-verification` | Seller profile after phone verified |
| `POST /api/auth/phone/send` | Legacy/shared OTP (also locked) |

## Feature flags (production expectation)

- `ENABLE_PHONE_OTP=true`
- `ENABLE_SMS_OTP=true`
- `SENDCHAMP_OTP_CHANNEL=sms`
- Sendchamp keys + `SENDCHAMP_SMS_SENDER=YIKE`

## Out of scope

Live SMS E2E against production Sendchamp (requires founder/device). Wiring and single-send guarantees are code-complete.
