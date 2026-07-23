# Production Readiness Report — Seller Verification & Onboarding v1

**Date:** 2026-07-23  
**Commit:** **Not committed** — awaiting founder review  

## GO / NO-GO

| Gate | Status |
|------|--------|
| Local TypeScript (`tsc --noEmit`) | PASS |
| Entry points → `/agent/verify` or choose | PASS (code) |
| Phone OTP via existing Sendchamp path | PASS (reuse) |
| Seller profile + consent API | PASS |
| Choose Property / Vehicle after submit | PASS |
| Publish blocked until admin Approve | PASS (`assertCanPublishListing`) |
| Admin queue shows state/address/DOB | PASS |
| Migration created + project verified | PASS |
| Migration applied on production | **NO — founder must apply** |
| End-to-end SMS on production | **Pending env + migration** |

## Coolify / env (already required for SMS)

- `ENABLE_PHONE_OTP=true`
- `ENABLE_SMS_OTP=true`
- `SENDCHAMP_OTP_CHANNEL=sms`
- `SENDCHAMP_SMS_SENDER=YIKE`
- Sendchamp API keys (not Supabase keys)

## Smoke checklist (after migrate + deploy)

1. Buyer browse / save — no seller force  
2. Sell CTA → Verify Yourself page  
3. SMS OTP → ✓ Phone Number Verified  
4. State + address + DOB + consent → Complete Verification  
5. Land on Choose Listing Type → property wizard  
6. Submit listing → pending; cannot go live until Approve  
7. `/lex/auth/agents` shows address/DOB/state; Approve → Verified Seller → publish OK  

## Risk notes

- Until migration is applied, timestamp columns may fail writes — apply before deploy or gate deploy behind migration.  
- Columns are additive (`IF NOT EXISTS`); safe to apply once.  

## Related docs

- [SELLER_VERIFICATION_UX_REPORT.md](./SELLER_VERIFICATION_UX_REPORT.md)  
- [SELLER_PROFILE_SMS_OTP_VALIDATION.md](./SELLER_PROFILE_SMS_OTP_VALIDATION.md)  
- [SELLER_PROFILE_VALIDATION.md](./SELLER_PROFILE_VALIDATION.md)  
- [SELLER_ADMIN_REVIEW_WORKFLOW.md](./SELLER_ADMIN_REVIEW_WORKFLOW.md)  
- [SELLER_VERIFICATION_MIGRATION_REPORT.md](./SELLER_VERIFICATION_MIGRATION_REPORT.md)  
