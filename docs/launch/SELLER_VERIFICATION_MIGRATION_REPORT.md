# Database Migration Report — Seller Onboarding v1

**Date:** 2026-07-23  
**Project:** `hlpojfurfldvcxfxhveg` (verified via `npm run verify:supabase-project -- --require-linked`)  
**File:** `supabase/migrations/20260723153614_seller_verification_onboarding_v1.sql`  
**Apply:** **Do not auto-push.** Founder must apply (SQL Editor or approved `db:push`).

## Why

Existing schema already had contact + verification status + address/DOB. Onboarding v1 needs durable timestamps for the status chain and admin audit trail on profiles.

## Columns added to `profiles`

| Column | Type | Purpose |
|--------|------|---------|
| `phone_verified_at` | timestamptz | SMS/WhatsApp OTP success |
| `seller_profile_completed_at` | timestamptz | Required profile fields saved |
| `verification_submitted_at` | timestamptz | Entered manual review |
| `verified_at` | timestamptz | Admin approved Verified Seller |
| `verified_by` | uuid → profiles | Approving admin |
| `verification_notes` | text | Latest admin notes / request-info |

## Backfills

- `phone_verified_at` from `whatsapp_verified_at` where `phone_verified`  
- `seller_profile_completed_at` when DOB + state + address already present  
- `verification_submitted_at` when status already pending/approved/verified  

## Not changed

- No new enum type — continue using `verification_status` + derived launch statuses  
- `agent_verifications` already holds address/DOB/occupation/notes/verified_by  

## Pre-apply checklist

1. `npm run verify:supabase-project -- --require-linked` → PASS  
2. Review SQL in migration file  
3. Apply on production project only  
4. Smoke: signup → `/agent/verify` → admin queue fields populate  
