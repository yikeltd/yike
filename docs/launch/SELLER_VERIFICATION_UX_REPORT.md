# Seller Verification UX Report — Onboarding v1

**Date:** 2026-07-23  
**Status:** Implemented — **hold commit** pending founder review  
**Route:** `/agent/verify`

## Philosophy

Ask only when needed. Buyers are not forced into a seller profile. Sellers must verify. Progressive disclosure. Banking-app calm. Mobile-first. Never leave the onboarding flow mid-step.

## Entry routing

| Trigger | Destination |
|---------|-------------|
| Sell / List Property / List Vehicle / Create Listing | `/agent/verify` if phone **or** seller profile incomplete |
| Same, when phone verified **and** profile complete | `/agent/listings/choose` → Property / Vehicle wizard |
| Legacy `/agent/become`, `/list`, `/list-property`, `/post-property` | Redirect into `/agent/verify` (or choose when ready) |

## Page structure

1. **Title:** Verify Yourself to Start Listing  
2. **Subtitle:** trust copy (phone + short seller profile before publishing)  
3. **Trust progress** (top, not sticky, no %, no bar): Email · Phone · Seller Profile · Manual Review  
4. **§1 Personal details** — Full Name / Email read-only; Phone editable until verified  
5. **Phone OTP** — same-row Verify → code input + Verify Code (horizontal on `sm+`)  
6. **§2 Seller profile** — revealed only after phone verified  
7. **Consent** checkbox (required)  
8. **Complete Verification** — full-width gold CTA

## After completion

- Persist: phone verified, seller profile completed, verification submitted (pending manual review)  
- Redirect: **Choose Listing Type** (`/agent/listings/choose`)  
- Publish live still blocked until admin **Approve** (Verified Seller) via `assertCanPublishListing`

## Progressive disclosure

- Seller profile section hidden until phone OTP succeeds  
- Manual Review step highlighted after submit; badge stays “pending” for buyers until approve  

## Files

- `src/app/agent/verify/page.tsx`
- `src/components/agent/seller-verification-client.tsx`
- `src/components/agent/seller-trust-progress.tsx`
- `src/components/agent/seller-phone-verify-row.tsx`
- `src/app/agent/listings/choose/page.tsx`
- `src/lib/seller-trust/onboarding.ts`
