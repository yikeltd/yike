# Search Path Fix Report — Supabase Security Audit Phase 2

**Date:** 2026-07-24  
**Migration:** `supabase/migrations/20260724075626_supabase_security_audit_phase1_5.sql` (§ Phase 2)

---

## Problem

Supabase Database Linter flags **mutable `search_path`** on functions, especially `SECURITY DEFINER` functions in the exposed `public` schema. Without a fixed search path, a malicious user could create objects in a schema that shadows `public` tables and hijack privileged function execution.

---

## Standard applied

All `public` schema **SECURITY DEFINER** functions now use:

```sql
SET search_path = public, pg_temp;
```

Trigger helpers and normalization utilities flagged alongside SECURITY DEFINER examples were also pinned:

| Function | Type | Fix |
|----------|------|-----|
| `check_agent_listing_limit()` | Trigger (listing cap) | `ALTER … SET search_path = public, pg_temp` |
| `set_listing_promotions_updated_at()` | Trigger (timestamps) | `ALTER … SET search_path = public, pg_temp` |
| `yike_normalize_phone_digits(text)` | IMMUTABLE normalizer | `ALTER … SET search_path = public, pg_temp` |
| `enforce_listing_moderation_guard()` | SECURITY DEFINER trigger | Covered by bulk SECURITY DEFINER loop |
| All other `public` SECURITY DEFINER functions | RPC / triggers | Bulk `DO $$ … $$` loop |

---

## Bulk fix mechanism

```sql
DO $$
DECLARE fn record;
BEGIN
  FOR fn IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid)
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = TRUE
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %I.%I(%s) SET search_path = public, pg_temp',
      fn.schema_name, fn.function_name, fn.identity_args
    );
  END LOOP;
END;
$$;
```

This is idempotent and picks up functions added in migrations after the 2026-06-09 cleanup pass.

---

## Prior work

Migration `20260609160000_security_linter_cleanup.sql` fixed a subset (e.g. `check_agent_listing_limit`, `set_updated_at`, slug helpers). Later migrations re-created or added functions with `SET search_path = public` only (missing `pg_temp`), or without any path pin.

---

## Verification after apply

Run in SQL Editor:

```sql
SELECT
  p.proname,
  pg_get_function_identity_arguments(p.oid) AS args,
  p.prosecdef,
  array_to_string(p.proconfig, ', ') AS config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosecdef = TRUE
  AND (
    p.proconfig IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM unnest(p.proconfig) c WHERE c LIKE 'search_path=%'
    )
  );
```

Expected: **zero rows**.

Re-run Supabase Dashboard → Database → Linter for “Function Search Path Mutable” warnings.

---

## Not changed

- Functions in `auth`, `storage`, or extension schemas (managed by Supabase)
- `SECURITY INVOKER` functions already using `public, pg_temp` (e.g. `yike_listing_moderation_bypass`, `is_staff_admin`)
