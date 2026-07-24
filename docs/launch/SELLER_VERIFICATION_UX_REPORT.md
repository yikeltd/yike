# Seller Verification UX Report

**Date:** 2026-07-23  
**Route:** `/agent/verify`  
**Status:** Simplified · **no commit** (founder review)

## Verdict

Seller verification UI is reduced to **title + progress + fields**. Explanatory paragraphs, address sub-hints, and placeholders are removed.

## Changes

| Item | Before | After |
|------|--------|-------|
| Page subtitle | “To keep Yike safe and trusted…” | Removed |
| Unlock copy | “Verify your phone to unlock…” | Removed (form appears only when phone verified) |
| Address | Hint text + placeholder listing House/Street/Area/City/Postal | Single **Address** textarea, no placeholder/hint |
| Fields | Placeholders on occupation/referral | Labels only: State*, Address*, DOB*, Occupation (optional), Referral (optional) |
| Declaration | Long legal paragraph | “I confirm the information provided is accurate and agree to Yike's marketplace rules.” + required checkbox |
| Phone verified | ✓ + number + timestamp (+ extra hints while unverified) | Verified state: ✓ Phone Number Verified + number + timestamp only |

## Kept (intentional)

- Read-only Full Name + Email (identity confirmation in section 1)
- Progress indicator (`SellerTrustProgress`)
- Phone OTP controls when not yet verified (no placeholders on phone/code inputs)

## Copy constants

`src/lib/seller-trust/onboarding.ts`:

- `SELLER_VERIFICATION_COPY` — title, progressTitle, completeCta, phoneVerifiedLabel only
- `SELLER_VERIFICATION_CONSENT` — short declaration

## Preview

- `GET /agent/verify` → **307** to `/auth/login?next=/agent/verify` when signed out (expected gate)
- Local: `http://localhost:3000/agent/verify` (sign in to review form)
