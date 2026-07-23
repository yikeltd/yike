# Seller Profile Validation — Onboarding v1

**Date:** 2026-07-23  
**API:** `POST /api/agent/seller-verification`  
**Status:** Implemented — **hold commit**

## Required fields

| Field | UI | Storage |
|-------|-----|---------|
| State | Nigeria states dropdown | `profiles.residential_state` (+ `agent_verifications.state`) |
| Address | Large textarea (house, street, area, city, postal optional) | `profiles.residential_address` / `office_address` |
| Date of Birth | Date picker | `profiles.date_of_birth` |

DOB rules: ISO `YYYY-MM-DD`, age ≥ 16, year ≥ 1920.

## Optional

| Field | Notes |
|-------|-------|
| Occupation | Stored on `agent_verifications.occupation` |
| Referral Code | Uses existing ambassador attribution (`referral_code_used` + cookie fallback) |

## Consent

Checkbox required. Copy locked in `SELLER_VERIFICATION_CONSENT`. CTA disabled until checked.

## Side effects on Complete Verification

1. Ensure `agent_unverified` role (become seller) if needed  
2. Set `seller_profile_completed_at`, `verification_submitted_at`  
3. Set `verification_status = pending`  
4. Queue / enrich `agent_verifications` pending row  
5. Redirect `/agent/listings/choose`

## Completeness helper

`isSellerProfileComplete()` — state + address + DOB (or `seller_profile_completed_at`).  
City is **not** a separate required field (embedded in address textarea).  
`hasBasicListingProfile()` updated for individuals to match (city optional).
