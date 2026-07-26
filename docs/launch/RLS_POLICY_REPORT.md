# RLS Policy Report — Supabase Security Audit Phase 1

**Date:** 2026-07-24  
**Project:** `hlpojfurfldvcxfxhveg` (Yike production)  
**Migration:** `supabase/migrations/20260724075626_supabase_security_audit_phase1_5.sql`  
**Applied to production:** **No** (awaiting SQL Editor apply or `npm run db:push` with linked CLI token)

---

## Summary

Six tables were flagged by the Supabase linter as **RLS enabled with no policies**. Each was reviewed against application usage. Five are **backend-only** (service_role via Next.js API routes). One (`verification_control_config`) requires **authenticated read** for the trust-status API.

All tables now have explicit policies that document intent and satisfy policy-presence checks without opening sensitive rows to browser roles.

---

## Table-by-table decisions

| Table | Purpose | Client access | Policies added |
|-------|---------|---------------|----------------|
| `ad_clicks` | Sponsored ad click analytics | **None** — `src/lib/advertisements/service.ts` uses admin client | `service_role` ALL; `anon`/`authenticated` deny |
| `ad_impressions` | Sponsored ad impression analytics | **None** — same service | `service_role` ALL; `anon`/`authenticated` deny |
| `listing_submit_log` | Listing submit rate-limit telemetry | **None** — `src/app/api/agent/listings/submit-guard/route.ts` uses admin client | `service_role` ALL; `anon`/`authenticated` deny |
| `scheduled_email_jobs` | Delayed transactional email queue | **None** — `src/lib/email/scheduled-jobs.ts` uses admin client | `service_role` ALL; `anon`/`authenticated` deny |
| `whatsapp_otp_sessions` | WhatsApp OTP provider session log | **None** — `src/lib/whatsapp-verification/service.ts` uses admin client | `service_role` ALL; `anon`/`authenticated` deny |
| `verification_control_config` | Singleton trust-gate flags | **Read:** authenticated via `/api/account/trust-status`. **Write:** staff admin API only | Staff ALL; authenticated SELECT; `service_role` ALL; `anon` deny |

---

## Privilege revocations

For backend-only tables, table-level grants were revoked from `anon` and `authenticated`:

```sql
REVOKE ALL ON <table> FROM anon, authenticated;
```

`service_role` bypasses RLS and retains full access via explicit policies and default superuser behavior.

---

## verification_control_config exception

This table was listed as backend-only in the audit brief, but **`getVerificationControlConfig()` is called with the user's Supabase session** in:

- `src/app/api/account/trust-status/route.ts`
- `src/lib/verification/sync-meta.ts`
- `src/lib/verification/review-queue.ts`

The config contains non-secret feature flags (e.g. whether WhatsApp verification is required). An **authenticated SELECT** policy is intentional and safe. Writes remain staff-only (`is_staff_admin()`) or service_role.

---

## Expected linter outcome

After migration apply, **“RLS Enabled No Policy”** warnings for these six tables should clear.

---

## Apply instructions

1. Confirm guard: `npm run verify:supabase-project -- --require-linked`
2. Apply **only** `20260724075626_supabase_security_audit_phase1_5.sql` via [Supabase SQL Editor](https://supabase.com/dashboard/project/hlpojfurfldvcxfxhveg/sql/new), or run `npm run db:push` locally with `SUPABASE_ACCESS_TOKEN` in `.env.local`
3. Re-run Supabase Database Linter in Dashboard → Database → Linter
