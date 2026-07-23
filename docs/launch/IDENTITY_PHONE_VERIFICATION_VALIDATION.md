# Phone Verification Validation — Identity v1

**Date:** 2026-07-23 (updated — SMS primary)  
**Channel:** Sendchamp **SMS OTP** (production) · WhatsApp OTP deferred

## Policy

- **Not required** for browse, save, or WhatsApp contact.
- **Required** before become-seller and create/submit listing.

## How Phone Verified is set

| Path | Effect |
|------|--------|
| `POST /api/profile/phone/verify-code` (SMS) | `phone_verified=true` + WhatsApp contact fields synced / timestamped |
| `/api/profile/whatsapp/verify-code` (legacy, flag-gated) | `whatsapp_verification_status=verified`, `phone_verified=true` |

`isPhoneVerifiedForSeller()` treats either `phone_verified` or WhatsApp verified as success.

## Seller UX

- `/auth/verify-phone?next=…` — **Verify Your Phone Number** + SMS OTP panel
- New listing page redirects here when phone not verified
- Become-seller card/API block with `phone_verification_required`
- Listing form redirects on API code `phone_verification_required`
- Copy: “Verify your phone to start selling.”

## Flags

- `ENABLE_PHONE_OTP=true`, `ENABLE_SMS_OTP=true`, `SENDCHAMP_OTP_CHANNEL=sms`
- `ENABLE_WHATSAPP_OTP=false` until WhatsApp Business is ready

## Ops docs

See `SMS_VERIFICATION_REPORT.md`, `OTP_VALIDATION_REPORT.md`, `SELLER_VERIFICATION_GATE_REPORT.md`, `SENDCHAMP_SMS_OTP_SECURITY_REVIEW.md`, `SENDCHAMP_SMS_OTP_PRODUCTION_READINESS.md`.
