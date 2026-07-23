# OTP Validation Report — Phone SMS

**Date:** 2026-07-23  
**Status:** Validated in code (`tsc --noEmit` clean) · live SMS requires rotated Sendchamp keys

## Send path

| Check | Result |
|-------|--------|
| OTP never generated on client | Pass — `generateOtp()` / Verification API server-side only |
| Default channel SMS (not WhatsApp) | Pass — `preferredChannel ?? "sms"`, `SENDCHAMP_OTP_CHANNEL=sms` |
| Sender YIKE | Pass — `resolveSmsSender` defaults to `YIKE` |
| 6-digit numeric | Pass — `SENDCHAMP_OTP_LENGTH` / `OTP_LENGTH = 6` |
| 30-minute expiry | Pass — env + `OTP_EXPIRY_MS = 30 * 60 * 1000` |
| Branded SMS template | Pass — `buildSmsOtpMessage()` |
| Verification API register + confirm | Pass — seller + shared OTP SMS paths |
| Resend cooldown ~60s | Pass — UI + server `RESEND_COOLDOWN_MS` / `OTP_RESEND_COOLDOWN_MS` |
| Rate limit ≤3 sends / phone / hour | Pass — seller service |

## Verify path

| Check | Result |
|-------|--------|
| Confirm via Sendchamp `/verification/confirm` | Pass when `provider_reference` present |
| Wrong code → clear error + attempt bump | Pass |
| Max attempts (5) | Pass |
| Expired code | Pass — session marked expired |
| Success → `phone_verified = true` | Pass |
| Success timestamp | Pass — `whatsapp_verified_at` + session `consumed_at` (no separate `phone_verified_at` column yet) |

## UX (`/auth/verify-phone`)

- Title: **Verify Your Phone Number**
- Masked display: `+234 XXX XXX XXXX` via `formatWhatsappDisplay`
- 6-digit OTP input, Verify + Resend (60s cooldown)
- Validity hint: “Code is valid for 30 minutes.”
- Gate copy: “Verify your phone to start selling.”

## Dry-run without production keys

- Missing / invalid `SENDCHAMP_*` → 503 friendly error
- No secrets in client bundles (API routes `runtime = "nodejs"`)
- Dev non-prod fallback remains only on legacy `/api/auth/phone/*` hash path when Sendchamp down

## Known residual

- If Sendchamp ignores `in_app_token: true`, users could receive a provider-template SMS plus Yike branded SMS — monitor first production sends; fall back to Verification-API-only delivery if needed.
