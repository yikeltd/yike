# Verification State Synchronisation Report

**Date:** 2026-07-23  
**Status:** Fixed · **no commit** (founder review)

## Bug

After phone OTP success (or when phone was already verified), UI could still show **“Verify your phone number first.”** — stale client error and/or profile state not refreshed across auth / profile / seller onboarding.

## Causes

1. Client set `error` on early submit; `onVerified` never cleared it.
2. Local `phoneVerified` / `profile` not synced when server `initialProfile` refreshed.
3. Verify API returned only `{ ok, message }` — client invented timestamp without DB confirmation.
4. Profile patch failure on verify was logged but still returned success → UI “verified”, API later said not verified.
5. Seller-verification POST select omitted `phone_verified_at` (weaker for `isPhoneVerifiedForSeller` edge cases).

## Fixes

| Fix | Detail |
|-----|--------|
| Clear gate error on verify | `applyPhoneVerified` sets `setError("")` and clears “Verify your phone…” on profile sync |
| Sync from server props | `useEffect` on `initialProfile` updates phoneVerified + timestamps |
| `router.refresh()` after OTP | Revalidates RSC profile without manual reload |
| Verify API payload | Returns `phoneVerified`, `phoneVerifiedAt`, `phone` |
| Fail closed on profile write | Verify returns 500 if `phone_verified` patch fails |
| Progress slice | Includes `phone_verified`, `whatsapp_verification_status: verified` immediately |
| Complete CTA | Disabled when `!phoneVerified`; never shows unlock dashed copy when verified |

## Sync contract

```
OTP verify success
  → DB: phone_verified=true, phone_verified_at, whatsapp_* verified
  → API JSON: phoneVerified + phoneVerifiedAt + phone
  → Client: setPhoneVerified(true) + profile patch + clear error + router.refresh()
  → Progress: Phone step done
  → Seller profile section visible
```

## Rule

If phone is verified (local or `isPhoneVerifiedForSeller(profile)`), **never** surface “Verify your phone number first.” as a blocking message for an already-verified session. Transient API mismatch triggers refresh + soft retry copy instead.
