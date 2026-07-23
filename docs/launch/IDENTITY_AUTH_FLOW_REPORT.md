# Authentication Flow Report — Identity & Seller Verification v1

**Date:** 2026-07-23  
**Status:** Implemented (hold commit — founder review)  
**Scope:** Layered trust for launch — email OTP → browse → phone to sell → manual seller review → Verified Seller.

## Flow (as shipped)

```
Signup (name, email, phone, PIN×2, math challenge, terms)
  → Email OTP (6-digit) → Email Verified = true → session usable
  → Browse / save / contact freely
Login (email + 6-digit PIN)
  → If email not verified → Email OTP modal / verify gate
Want to sell / list
  → Phone SMS/WhatsApp OTP → Phone Verified = true
  → Become seller (agent_unverified)
  → Submit listing (status=pending) → seller enters Pending Manual Verification
  → Admin Approve → Verified Seller badge
  → Only then can listings be published (approved live)
Future
  → NIN/KYC upgrade on same account (hooks documented; not automated in v1)
```

## Phase alignment

| Phase | Requirement | Status |
|-------|-------------|--------|
| 1 Account creation | Full name, email, phone, create/confirm PIN, human verify, terms | Aligned — existing PIN signup; no placeholders |
| 2 Email OTP | Gate account until verified; expiry/cooldown/attempts | Aligned — `src/lib/auth-email-otp/` |
| 3 Login | Email + PIN; unverified → email verify | Aligned — login API `needsEmailVerify` |
| 4 Phone verify | Not for browse; mandatory before list/sell | **Wired** — gates + `/auth/verify-phone` |
| 5 Manual seller | Phone ≠ live listings; pending → approve badge | **Wired** — queue + publish gate |
| 6 Listing workflow | Draft→Submitted→Under Review→Approved→Published | Mapped onto `pending`/`approved` (see workflow module) |
| 7 Admin portal | `/lex` seller queue, audited actions | Enhanced `/lex/auth/agents` |
| 8 Future KYC | Extensible methods without new accounts | `src/lib/seller-trust/kyc-readiness.ts` |

## Seller launch statuses (derived)

Stored via existing `profiles` fields — no new migration:

| Status | Signals |
|--------|---------|
| Unverified | `!email_verified` |
| Email Verified | `email_verified && !phone` |
| Phone Verified | phone/WhatsApp verified, not pending/approved |
| Pending Manual Verification | `verification_status === pending` |
| Verified Seller | `verified_badge` / `agent_verified` / approved |
| Suspended | banned / account suspended |
| Rejected | `verification_status === rejected` |

## Key modules

- `src/lib/seller-trust/` — status, gates, workflow, KYC hooks
- Phone gate: listing create, become seller, new listing page redirect
- Publish gate: admin listing moderate/review refuse if seller not verified
- First listing submit: `ensurePendingManualSellerVerification`

## Gaps / limitations

- Property DB has no `draft` status — “draft” is client-side until insert; insert = `pending` (under review).
- Phone OTP delivery depends on Sendchamp / WhatsApp OTP env flags; UI always forces verify path for sellers.
- Paid “Business Verified” (`seller_verifications`) remains a separate optional upgrade path.
- No commit per founder request.
