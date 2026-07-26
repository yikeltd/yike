# SECURITY DEFINER RPC Audit Report — Supabase Security Audit Phase 4

**Date:** 2026-07-24  
**Migration:** `supabase/migrations/20260724075626_supabase_security_audit_phase1_5.sql` (§ Phase 4)

---

## Baseline

Migration `20260609160000_security_linter_cleanup.sql` revoked `EXECUTE` on **all** public `SECURITY DEFINER` functions from `PUBLIC`, `anon`, and `authenticated`, then granted `service_role` only. Subsequent migrations intentionally re-granted specific RPCs for signup, OTP, and social features.

This audit confirms each flagged function’s role and re-locks trigger-only internals.

---

## Flagged functions — disposition

| Function | SECURITY DEFINER | Called from frontend? | Execute grants |
|----------|------------------|----------------------|----------------|
| `enforce_listing_moderation_guard()` | Yes (trigger) | **No** — trigger on `properties` | **REVOKE** from PUBLIC, anon, authenticated |
| `check_agent_listing_limit()` | No (trigger) | **No** — trigger on listings | **REVOKE** from PUBLIC, anon, authenticated |
| `set_listing_promotions_updated_at()` | No (trigger) | **No** — trigger on `listing_promotions` | **REVOKE** from PUBLIC, anon, authenticated |
| `get_listing_like_count(uuid)` | Yes | **Yes** — `src/lib/social/stats.ts`, listing-like API | **anon, authenticated, service_role** (aggregated count only) |
| `get_profile_social_stats(uuid)` | Yes | **Yes** — `src/lib/social/stats.ts` | **anon, authenticated, service_role** (aggregated JSON) |
| `get_public_follow_profiles(...)` | Yes | **Yes** — `src/lib/social/stats.ts` | **authenticated, service_role** (public profile fields) |
| `yike_check_signup_duplicates(...)` | Yes | **Yes** — signup + check-duplicates API via OTP DB client | **anon, authenticated, service_role** (token-gated inside function) |
| `yike_normalize_phone_digits(text)` | No (IMMUTABLE) | Indirect — SQL only | Default execute; not PostgREST-exposed as RPC |

---

## Intentional public / client RPCs (retained)

These require `anon` or `authenticated` execute because the app calls them from the browser-facing Supabase client (often with `YIKE_OTP_SERVER_TOKEN` validation inside the function):

### Auth & signup
- `yike_username_available`, `yike_complete_signup`, `yike_auth_confirm_reviewer`
- `yike_check_signup_duplicates`
- `yike_pin_login_lookup`
- Full `yike_auth_otp_*` and `yike_signup_pending_*` family
- `yike_email_*` OTP family

### Social (aggregated, no PII leak)
- `get_profile_social_stats`, `get_listing_like_count`, `get_public_follow_profiles`

### Analytics counters
- `increment_property_views`, `increment_contact_clicks` — called from API routes; granted to anon/authenticated for PostgREST compatibility

### Careers & leads (token or validation inside)
- `yike_career_submit_application`, `yike_career_submit_follow_up`
- `yike_log_lead` (client-side lead capture with validation)

---

## Backend-only RPCs (service_role only)

Revoked from client roles by `20260609160000` and **not** re-granted:

- `yike_admin_reset_profile_pin` — server admin API (note: older migration granted authenticated; cleanup revoked client access)
- `yike_dispatch_support_worker`, `yike_ensure_agent_wallet`, `yike_find_duplicate_lead`
- `yike_mark_lead_responded`, `yike_insert_listing_history_event`
- `yike_refresh_*` maintenance functions
- All OTP internals not listed in intentional public set

---

## Trigger functions — why REVOKE EXECUTE

PostgreSQL triggers invoke functions directly; they do **not** need `GRANT EXECUTE` to anon/authenticated. Exposing trigger functions via PostgREST would allow direct RPC calls bypassing trigger context — revoking closes that surface.

---

## Verification after apply

```sql
SELECT
  p.proname,
  pg_get_function_identity_arguments(p.oid) AS args,
  p.prosecdef,
  array_agg(DISTINCT acl.grantee::text) AS grantees
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
LEFT JOIN LATERAL aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) acl ON true
WHERE n.nspname = 'public'
  AND p.proname IN (
    'enforce_listing_moderation_guard',
    'check_agent_listing_limit',
    'set_listing_promotions_updated_at'
  )
GROUP BY p.oid, p.proname, args, p.prosecdef;
```

Expected: trigger functions have **no** grants to `anon` or `authenticated`.

---

## Recommendations (future, out of scope)

- Move remaining SECURITY DEFINER RPCs to a private schema when Supabase supports unexposed schemas for RPC
- Prefer API routes + service_role over widening EXECUTE grants for new functions
