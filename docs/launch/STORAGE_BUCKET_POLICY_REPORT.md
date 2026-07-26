# Storage Bucket Policy Report — Supabase Security Audit Phase 3

**Date:** 2026-07-24  
**Migration:** `supabase/migrations/20260724075626_supabase_security_audit_phase1_5.sql` (§ Phase 3)

---

## Problem

Buckets `property-media` and `ad-creatives` are **public** (direct object URLs required for listing photos, avatars, and ad creatives). Broad `SELECT` policies on `storage.objects` allowed **any client to list all objects in the bucket** via the Storage API — unnecessary exposure and a linter finding.

Prior cleanup (`20260609160000_security_linter_cleanup.sql`) removed a similar policy for profile images. Property-media and ad-creatives policies were not updated at that time.

---

## Policies removed

| Policy name | Bucket | Previous effect |
|-------------|--------|-----------------|
| `Property media public read` | `property-media` | `SELECT TO public USING (bucket_id = 'property-media')` — full bucket listing |
| `Public read ad creatives` | `ad-creatives` | `SELECT TO public USING (bucket_id = 'ad-creatives')` — full bucket listing |

---

## What still works

| Capability | Mechanism |
|------------|-----------|
| Public image URLs | Bucket `public = true` — objects reachable at `/storage/v1/object/public/<bucket>/<path>` |
| Agent listing photo upload | `Agents upload listing photos` — INSERT under `properties/*` |
| Agent photo update | `Agents update listing photos` — UPDATE under `properties/*` |
| Staff full manage | `Staff manage property media` — ALL for `is_staff_admin()` |
| Ad creative staff upload | `Staff upload/update/delete ad creatives` — staff-only mutations |

Upload paths remain path-scoped and role-gated. No change to `POST /api/media/upload` or admin ad flows.

---

## Security improvement

- **Before:** Anonymous/authenticated clients could enumerate all object names in public buckets
- **After:** Object access requires knowing the full path (as URLs already do in the app); listing via Storage API is blocked for client roles

---

## Unchanged buckets (reference)

| Bucket | Public | Listing policy |
|--------|--------|----------------|
| `profile-images` | Yes | No broad SELECT (fixed 2026-06-09) |
| `agent-documents` | No | Private — not in scope |

---

## Verification after apply

1. Confirm a known listing image URL still loads in browser
2. Confirm agent upload flow on `/upload` or listing form
3. Supabase linter: “Storage Object Listing” warnings for these buckets should clear

```sql
SELECT policyname, cmd, roles, qual
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND qual::text LIKE '%property-media%'
     OR qual::text LIKE '%ad-creatives%';
```

Expected: no `SELECT` policies with bucket-only `USING (bucket_id = '…')` for these buckets.
