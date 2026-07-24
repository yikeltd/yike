# OTP Delivery Audit Report — Seller Phone SMS

**Date:** 2026-07-23  
**Scope:** `/agent/verify` · `/api/profile/phone/send-code` · Sendchamp SMS  
**Status:** Fixed in code · **no commit** (founder review)  
**tsc:** Pass (`npx tsc --noEmit`)

## Verdict

**One user action → one OTP generation → one DB claim → one branded SMS** is now enforced on both client and server. Duplicate “Hi There” + “Welcome to Yike” delivery path is closed.

## Root causes found

| Cause | Effect | Fix |
|-------|--------|-----|
| `sendOtpSms` fell back to `/verification/create` **without** `in_app_token` | Sendchamp default template (“Hi There”) after / instead of branded SMS | Branded `/sms/send` only |
| `sendPhoneOtp` SMS path fell through to a **second** `generateOtp` + `deliverOtp` after register | Second OTP + second SMS | Fail closed after register/branded failure — no fallthrough |
| Client double-click / concurrent fetch | Two API calls before cooldown row existed | `useRef` send lock + disable while loading/cooldown |
| Concurrent server requests passed cooldown then both sent | Two SMS, two sessions | In-flight `Map` lock + DB claim row **before** provider send |
| Old SMS template | “Welcome to Yike… Happy listing.” | Single short template (below) |

## Canonical send path (seller)

```
UI Send/Resend (ref lock + 60s cooldown)
  → POST /api/profile/phone/send-code
  → sendSellerPhoneVerificationCode
       · in-flight lock (userId:phone:channel)
       · rate limit ≤3 / phone / hour
       · cooldown 60s via last whatsapp_otp_sessions.created_at
       · INSERT session claim (pending reference)  ← cooldown starts here
       · generateOtp (server)
       · /verification/create (in_app_token: true, token = OTP)  ← no SMS
       · /sms/send branded body once
       · UPDATE session with real provider_reference
```

## SMS template (single)

```
Yike

Your verification code is:

{OTP}

Valid for 30 minutes.

Never share this code.
```

Source: `src/lib/phone-verification/copy.ts` → `buildSmsOtpMessage()`.

## Locks & cooldown

| Layer | Mechanism |
|-------|-----------|
| Client | `sendLockRef` / `verifyLockRef`; buttons disabled while busy; 60s resend UI |
| Server (seller) | `sendInFlight` Map; DB claim before send; 60s cooldown; 3/hour |
| Server (legacy `/api/auth/phone/send`) | `phoneOtpSendInFlight` Map + existing `OTP_RESEND_COOLDOWN_MS` |

## Residual risk

- Multi-instance race without shared lock is mitigated by **DB claim before send** (second request hits cooldown via latest `created_at`).
- If Sendchamp ever ignores `in_app_token`, stop passing `sender` on register or switch to Verification-API-only delivery (monitor first live sends).

## Files touched

- `src/lib/phone-verification/copy.ts`
- `src/lib/phone-verification/service.ts`
- `src/lib/phone-verification/provider.ts` (unchanged path; still in_app + branded)
- `src/lib/notifications/providers/sendchamp.ts`
- `src/lib/otp/service.ts`
- `src/components/agent/seller-phone-verify-row.tsx`
- `src/components/profile/phone-sms-verification-panel.tsx`
