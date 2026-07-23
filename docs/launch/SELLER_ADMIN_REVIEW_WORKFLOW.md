# Admin Review Workflow Report — Seller Onboarding v1

**Date:** 2026-07-23  
**Queue:** `/lex/auth/agents`  
**API:** `PATCH /api/admin/agents/verification` (+ status suspend path)

## Queue card fields

Photo (avatar/selfie), name, email, phone, status (DB label), **state**, **address**, **DOB**, registration date, listing count, occupation (if any), notes.

## Actions (audited)

| Action | Effect |
|--------|--------|
| Approve | `agent_verified`, `verified_badge=true`, `verification_status=approved`, profile `verified_at` / `verified_by`, notes |
| Reject | `verification_status=rejected`, badge off, notes |
| Request more info | Stay pending, `verification_required=true`, notes on profile + verification row |
| Suspend / reinstate / hold | Existing `AgentStatusActions` + audit |

Approve / Reject still require admin PIN session.

## Status chain (ops)

```
UNVERIFIED → EMAIL_VERIFIED → PHONE_VERIFIED → PROFILE_COMPLETED →
PENDING_REVIEW → VERIFIED | REJECTED | SUSPENDED
```

Derived in `deriveSellerLaunchStatus()`; labels in `SELLER_DB_STATUS_LABELS`.

## Publish gate

Listing admin approve / publish APIs continue to call `assertCanPublishListing` — **403** until Verified Seller.
