# OTP Trace Report — Seller Phone SMS

**Date:** 2026-07-26  
**Scope:** User tap → Sendchamp → DB → UI  
**Commit status:** **Not committed — awaiting founder review**

## Lifecycle (seller / profile)

```
UI onClick (Send / Resend)
  → sendLockRef + sending guard (no Strict Mode auto-send)
  → POST /api/profile/phone/send-code
  → sendSellerPhoneVerificationCode
       · in-flight Map dedupe (per process)
       · rate limit ≤3 / phone / hour
       · cooldown 60s via last whatsapp_otp_sessions.created_at
       · expire prior status=sent sessions
       · INSERT claim row (pending:uuid)          ← DB record #1
       · provider.sendOtp(channel=sms)
            · ONE POST /verification/create
            · in_app_token: false (Sendchamp delivers)
            · sender: YIKE
            · meta_data.message with {{code}}
       · UPDATE claim with verification_reference
  → JSON { ok, channel, message, expiresMinutes }
```

Verify path (separate tap):

```
POST /api/profile/phone/verify-code
  → latest status=sent session
  → /verification/confirm (or local: hash if fallback legacy)
  → profiles.phone_verified = true
```

## Frontend inspection

| Check | Result |
|-------|--------|
| Duplicate event handlers | No — single `onClick` → `sendCode` |
| React Strict Mode auto-send | No — send is click-only; no mount `useEffect` send |
| Double-tap | Guarded: `sendLockRef` + `sending` + cooldown disable |
| Concurrent fetches | Client lock + server `sendInFlight` Map |

Files: `phone-sms-verification-panel.tsx`, `seller-phone-verify-row.tsx`

## Guarantee after fix (single process)

One tap → one OTP session claim → **one** `/verification/create` → one Sendchamp reference → one DB update.

## Residual risk (documented)

Multi-instance Coolify race: two pods can both pass cooldown before either claim is visible. In-flight Map is per-process only. Mitigation deferred (advisory lock / unique index) — not the primary charge amplifier found in code.
