# OTP Generation Audit Report

**Date:** 2026-07-24  
**Scope:** Phone SMS OTP generation & storage  
**Commit:** **not committed** (pending review)

## Generation

| Rule | Implementation |
|------|----------------|
| One 6-digit code | `generateOtp()` in `src/lib/otp/crypto.ts` — `randomInt(100000, 1000000)` (inclusive 6-digit range) |
| Server-only | Generated in `createLocalSmsOtp()` / `sendPhoneOtpUnlocked` — never from client |
| Exact length | `OTP_LENGTH = 6` |

## Storage keys (normalized phone)

| Flow | Phone key at generate/store | International for Sendchamp |
|------|----------------------------|-----------------------------|
| Seller / profile | `phone_local` (11-digit `08…`) + `phone_intl` (`234…` via `toInternationalNigerianPhone`) | `phoneIntl` → `toSendchampPhone` |
| Auth signup SMS | Local 11-digit via `normalizeNigerianPhone` in API + OTP RPC | `toSendchampPhone(phone)` at send |

Same normalization helpers: `normalizeNigerianPhone`, `toInternationalNigerianPhone`, `toSendchampPhone`, `normalizePhoneForDuplicateCheck`.

## One active OTP

| Flow | Behavior |
|------|----------|
| Seller | Before claim insert: expire all `whatsapp_otp_sessions` with `status=sent` for same `user_id` + `phone_intl` |
| Auth | New row via `yike_otp_insert_pending`; verify reads **latest** verifiable row (`yike_otp_latest_verifiable`) |

## What is stored (SMS)

| Flow | Stored secret | Not stored |
|------|---------------|------------|
| Seller | `provider_reference = local:{sha256(code)}` | Plain OTP, Sendchamp verification reference |
| Auth | `otp_hash = sha256(code)` | Plain OTP; `provider_reference` may hold SMS delivery id only |

**Previous bug:** Auth SMS stored `hashOtp(sendchampReference)` and verified via `/verification/confirm` — mismatch with the code in the branded SMS.

## Concurrency

- In-process send locks: `sendInFlight` (seller), `phoneOtpSendInFlight` (auth)
- DB claim row before SMS (seller) so cooldown starts before provider call
- Resend cooldown: 60s

## Logging

Structured logs use phone fingerprint / suffix only. **OTP value is never logged in production** (dev fallback may log code only when `!isProductionEnv()`).

## Verdict

Generation and storage now share one code, one hash, one normalized phone key per request.
