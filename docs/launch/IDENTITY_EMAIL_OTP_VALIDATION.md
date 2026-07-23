# Email OTP Validation — Identity v1

**Date:** 2026-07-23  
**Pipeline:** `src/lib/auth-email-otp/` + signup/login routes

## Behaviour validated (code path)

| Control | Implementation |
|---------|----------------|
| 6-digit OTP | `generateOtp()` + email template |
| Expiry | `OTP_EXPIRY_MS` via `lib/otp/constants` |
| Resend cooldown | `OTP_RESEND_COOLDOWN_MS` + per-email/IP hourly caps |
| Attempt limits | `OTP_MAX_ATTEMPTS` + increment RPC |
| Success | Sets Auth `email_confirmed_at` + `profiles.email_verified = true` |
| Signup | Pending signup row until OTP verify finalizes user |
| Login | `needsEmailVerify` → Email OTP modal; no trusted-device skip while unverified |

## Gates

- Listing create / become seller require email verified.
- Browse / save / contact do **not** require email (browse-first).

## UX

- Signup opens email OTP modal after successful pending create.
- Login surfaces clear “verify email” copy via `AUTH_USER_MESSAGES`.
- Dev non-prod may surface `devOtp` for local testing.

## Known limitations

- Relies on Resend configuration in production; local can log OTP when Resend unset.
- Reviewer/test accounts may bypass email confirm by design.
