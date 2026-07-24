# OTP Verification Audit Report

**Date:** 2026-07-24  
**Scope:** Phone SMS OTP confirm paths  
**Commit:** **not committed** (pending review)

## Previous failure mode

Verify called Sendchamp `/verification/confirm` while the user typed the code from the **branded** `/sms/send` message. That code was not reliably bound to the Verification API session (especially with dual-send / `in_app_token` quirks) → correct OTP rejected.

Auth SMS also hashed the **Sendchamp reference**, not the OTP digits, so local hash fallback could never match the SMS code.

## Current verify rules (SMS)

1. Trim input; require `/^\d{6}$/` (seller) or length 6 (auth API).
2. Load **latest unexpired** OTP for the identity key:
   - Seller: `whatsapp_otp_sessions` where `user_id` + `status=sent`, newest `created_at`
   - Auth: `yike_otp_latest_verifiable(phone)` with same normalized local phone used at send
3. **String compare via SHA-256 hash** (`verifyOtpHash` / `confirmLocalOtp`) — not integer coercion.
4. Consume / mark verified **only after** hash success.
5. Immediately set `phone_verified: true` + `phone_verified_at` on profile (seller).

## Paths

| API | Service | Compare |
|-----|---------|---------|
| `POST /api/profile/phone/verify-code` | `verifySellerPhoneCode` → provider `confirmOtp` | `local:{hash}` → `confirmLocalOtp` |
| `POST /api/auth/phone/verify` | `verifyPhoneOtp` | `verifyOtpHash(code, row.otp_hash)` for SMS |

WhatsApp channel still uses `confirmSendchampVerification` when `channel === "whatsapp"` and a non-local provider reference exists.

## Attempts / expiry

- Max 5 attempts; then user must request a new code
- Expiry: 30 minutes (`otpExpiryMinutes` / `OTP_EXPIRY_MS`)
- Expired sessions marked `expired` before error return

## User-facing errors

Friendly copy only (`PHONE_VERIFY_COPY` / `OTP_USER_MESSAGES`) — no provider dump, no OTP in responses.

## Verdict

SMS verify uses the same normalized phone + the same hashed code that was generated and SMS’d. Sendchamp confirm is no longer on the SMS path.
