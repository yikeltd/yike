# Seller Verification Fix

**Date:** 2026-07-26  
**Status:** Root cause identified and fixed  
**Production project:** `hlpojfurfldvcxfxhveg`

---

## Root cause

**Not RLS.** Not missing session. Not anon vs service-role client mismatch on this path.

Exact failure:

1. UI `POST /api/agent/seller-verification`
2. Route `ensureSellerRole()` updates `public.profiles` (admin/service client)
3. Update includes **`listing_rules_accepted_at`**
4. Production **`profiles.listing_rules_accepted_at` did not exist**
5. PostgREST/Postgres returned column error
6. Route mapped that to HTTP 500: **`Could not start seller account.`**

Throw site:

```83:86:src/app/api/agent/seller-verification/route.ts
  if (error) {
    console.error("[seller-verification] become seller failed:", error.message);
    return { ok: false, error: "Could not start seller account.", status: 500 };
  }
```

### Evidence

| Check | Result |
|-------|--------|
| Error string search | Only in `src/app/api/agent/seller-verification/route.ts` inside `ensureSellerRole` |
| Prod column exists? | `listing_rules_accepted_at = false` before fix |
| Migration history | `20250717100000_adaptive_trust_verification` **recorded as applied**, but columns were missing |
| RLS on this path | Admin client (service role); privileged-column trigger allows `service_role` |
| Secondary bug | Same route also wrote `updated_at`, which **also does not exist** on prod `profiles` — would have failed next with `Could not save seller profile.` |

---

## Files / database objects changed

| Change | Object |
|--------|--------|
| Migration | `supabase/migrations/20260726151253_repair_profiles_adaptive_trust_columns.sql` |
| Applied on prod | Same SQL via Supabase `apply_migration` (`repair_profiles_adaptive_trust_columns`) |
| API hardening | `src/app/api/agent/seller-verification/route.ts` |
| Doc | `docs/launch/SELLER_VERIFICATION_FIX.md` |

### Database objects involved

- Table: **`public.profiles`**
- Missing column that blocked become-seller: **`listing_rules_accepted_at`**
- Also repaired (same incomplete migration): `adaptive_trust_level`, `adaptive_trust_override`, verification escalation + bank verification columns

---

## Why it failed

Migration `20250717100000` is listed in `supabase_migrations.schema_migrations`, but the `ALTER TABLE profiles ADD COLUMN … listing_rules_accepted_at` portion was not present on the live table. Seller onboarding code assumed the column existed.

`/api/agent/become` already had a retry that strips `listing_rules_accepted_at`. Seller verification did not — so Complete Verification failed hard.

---

## Minimal fix

1. **DB (required):** add the missing adaptive-trust / listing-rules columns with `IF NOT EXISTS` (repair migration). Does **not** disable RLS, does **not** bypass seller verification.
2. **Code (defense + next-step):**
   - Retry become-seller update without `listing_rules_accepted_at` if the column error appears (same pattern as `become/route.ts`).
   - Stop writing non-existent `profiles.updated_at` on the profile save patch.

No business-logic change to verification gates (email/phone/consent still required).

---

## Verification steps

After Coolify deploys the code commit (DB already applied):

1. Register a **new** user (or use a buyer account not yet `agent_*`).
2. Complete phone step (FAT bypass OK if `AUTH_SMS_VERIFICATION_ENABLED=false`).
3. Open `/agent/verify`, fill form, accept consent, click **Complete Verification**.
4. Expect **200** from `POST /api/agent/seller-verification` with `{ ok: true, next: … }`.
5. Confirm `profiles.role = agent_unverified` and `listing_rules_accepted_at` set.
6. Confirm seller choose-listing / dashboard loads.
7. Confirm property or vehicle listing create still works for that seller.

### Network expectation (success)

| Field | Value |
|-------|--------|
| URL | `/api/agent/seller-verification` |
| Method | `POST` |
| Status | `200` |
| Body | `{ "ok": true, "next": "/agent/…" }` (choose-listing path) |

### Prior failure signature

| Field | Value |
|-------|--------|
| URL | `/api/agent/seller-verification` |
| Method | `POST` |
| Status | `500` |
| Body | `{ "error": "Could not start seller account." }` |

---

## Ruled out

- Missing authenticated user (would be `401 Sign in required`)
- RLS INSERT policy on `seller_profiles` (this flow updates `profiles`, not a separate seller_profiles insert)
- Disabling RLS or weakening privileged-column trigger
- Enum mismatch on `role` (text; `agent_unverified` already used elsewhere)
- Storage permissions (not reached)

---

## Ops note

If Complete Verification still fails after deploy, capture Coolify log line:

`[seller-verification] become seller failed: …`

That message now reflects the real Postgres/PostgREST error.
