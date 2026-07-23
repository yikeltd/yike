# Future KYC Readiness Report — Identity v1

**Date:** 2026-07-23  
**Constraint:** No automated NIN on day one; same account upgrades later.

## Design principles

1. Seller launch statuses stay derived from contact + manual approval.  
2. KYC providers add **signals**, not new user accounts.  
3. Admin Approve/Reject remains authoritative for Verified Seller.  
4. NIN encryption already exists on `agent_verifications` (manual path).

## Hook points (code)

| Hook | Location |
|------|----------|
| Method kinds / statuses | `src/lib/seller-trust/kyc-readiness.ts` |
| Status derivation | `src/lib/seller-trust/status.ts` |
| Apply provider result (planned) | `ApplyKycResultInput` type — wire when provider chosen |
| Admin override | `src/app/api/admin/agents/verification/route.ts` |
| Format-only NIN today | `src/lib/verification/nin-provider.ts` (`manual_review`) |

## Planned schema (migration later — not created in v1)

Only if a provider ships:

- `profiles.kyc_level`: `none | basic | nin | business`  
- Optional `profiles.verification_methods` jsonb history  
- Keep encrypted NIN on `agent_verifications`  

**Do not invent migrations until `npm run verify:supabase-project -- --require-linked` passes and founder approves apply.**

## Upgrade path (same account)

```
Email Verified → Phone Verified → Verified Seller (manual)
  → optional: nin_lookup verified → kyc_level=nin
  → optional: CAC → kyc_level=business
```

No Passport product rebuild; this stays marketplace seller trust only.

## v1 intentionally deferred

- Automated NIN API calls  
- Liveness SDK  
- New verification_methods table  
- Passport / Trust Economy UI  
