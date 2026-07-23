# Seller Verification Workflow Report — Identity v1 + Onboarding v1

**Date:** 2026-07-23 (updated — Seller Verification & Onboarding v1)

## Rule

Phone verification + seller profile unlock **submit for review**.  
**Live publish** requires **Verified Seller** (manual admin approval).

## Seller journey

1. Email verified  
2. `/agent/verify` — phone SMS OTP (Sendchamp / YIKE)  
3. Seller profile: state, address, DOB (+ optional occupation / referral) + consent  
4. Complete Verification → `agent_unverified`, profile timestamps, `verification_status=pending`, queue row  
5. Choose Listing Type → property / vehicle wizard  
6. Submit listing → `properties.status = pending`  
7. Admin reviews at `/lex/auth/agents`  
8. Approve → `agent_verified`, `verified_badge=true`, profile `verified_at` / `verified_by`  
9. Admin may then approve listings live  

## Status chain

```
UNVERIFIED → EMAIL_VERIFIED → PHONE_VERIFIED → PROFILE_COMPLETED →
PENDING_REVIEW → VERIFIED | REJECTED | SUSPENDED
```

## Listing workflow mapping

| Conceptual | DB today |
|------------|----------|
| Draft | Not inserted / client only |
| Submitted / Under Review | `pending` (also `flagged`) |
| Approved / Published | `approved` |

## Admin actions (audited)

| Action | Effect |
|--------|--------|
| Approve | Verified Seller + audit `agent.verification.approve` |
| Reject | `verification_status=rejected`, badge off |
| Request more info | Notes + stay pending / `verification_required` |
| Suspend / reinstate / hold | Existing `AgentStatusActions` + audit |

Listing approve/review APIs call `assertCanPublishListing` and return 403 if seller not verified.

## Buyer UX

`SellerTrustBadge` on listing agent card + seller profile:

- ✓ Verified Seller  
- ⏳ Verification Pending  
- ⚠ Unverified Seller  

## Gaps

- Decision history is via audit logs + `agent_verifications` fields; no separate timeline UI yet.  
- Selfie optional in Onboarding v1 (queue may have null selfie; staff can Request more info).  
- Business paid verification (`seller_verifications`) remains parallel — do not confuse with launch Verified Seller.
