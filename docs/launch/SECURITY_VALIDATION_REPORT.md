# Security Validation Report — Launch Candidate

**Date:** 2026-07-23  
**Scope:** Ship gate for marketplace launch candidate (auth, OTP, seller verification, ads schema).  
**Verdict:** **GO with founder follow-ups** (SMS E2E + optional Sendchamp rotation)

## Controls verified in this pass

| Area | Status | Notes |
|------|--------|-------|
| Supabase project guard | **PASS** | Linked ref = production only |
| Migrations | **PASS** | Applied once; no re-apply of historical migrations |
| Secrets in git | **PASS** | `.env.local` not staged; `.env.example` placeholders only |
| Typecheck / production build | **PASS** | No ship-blocking TS/build errors |
| Public health | **PASS** | Signup readiness flags true on yike.ng |
| PIN policy | **Present** | Client + server weak-PIN rejection in codebase |
| Phone normalization | **Present** | Local NG → `234…` for SMS/dedupe |
| Sendchamp webhook | **Present** | Route exists; webhook secret recommended in Coolify |
| Service role | **Server-only** | Not `NEXT_PUBLIC_` |

## Seller verification schema

New `profiles` columns (timestamps + notes + `verified_by`) support manual Verified Seller — **no automated NIN/KYC** in this candidate (launch-correct).

## Ads placement constraint

`advertisements_placement_check` extended for `homepage_slot_1`…`5` — empty slots collapse in UI (no forced empty chrome).

## Residual risks / founder actions

1. **Rotate Sendchamp** if keys were ever pasted/logged outside Coolify.
2. Confirm `SENDCHAMP_WEBHOOK_SECRET` and webhook URL `https://yike.ng/api/webhooks/sendchamp`.
3. Live SMS OTP + admin approve path not exercised by agent (no fake OTP claims).
4. Ensure RLS/admin-only paths for verification approve remain staff-gated (Lex).

## Out of scope (deferred by launch mode)

Passport UI, wallet, escrow, in-app chat, consumer Command Center — remain behind launch flags / not shipped as consumer surfaces.
