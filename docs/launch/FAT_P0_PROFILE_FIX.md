# FAT P0 — Profile not found + Avatar upload

**Date:** 2026-07-26  
**Status:** Fixed in code (await Coolify deploy + founder re-FAT)  
**Project:** `hlpojfurfldvcxfxhveg`

## Symptoms (founder FAT)

1. Signed-in user opens account/profile → **“Profile not found.”**
2. Avatar upload → **“We couldn't save this photo right now.”**

## Root cause

Launch hardening migrations revoked `SELECT`/`UPDATE`/`INSERT` on `profiles.pin_hash` and `profiles.admin_pin_hash` for `anon` / `authenticated`, then re-granted every **other** column.

PostgreSQL / PostgREST treat `select=*` as “every column on the table.” If the role lacks privilege on any column, the query fails with permission denied.

Consumer paths used:

```ts
.from("profiles").select("*")
```

That made `getProfile`, AuthProvider, verification screens, and public agent lookups return **null** — even when the row existed. The UI then showed “Profile not found.”

Avatar upload stored files with `service_role`, then updated `avatar_url` with the **user** JWT client. Cover upload already used admin for the DB write; avatar did not. Aligning avatar with cover + ensuring a profile row exists removes the save failure path.

PIN hashes remain unreadable by clients (intentional). See `docs/launch/PROFILES_PIN_HASH_REGRESSION.md`.

## Fixes

| Area | Change |
|------|--------|
| `src/lib/profile/safe-select.ts` | `PROFILES_SAFE_SELECT` — all columns except `pin_hash` / `admin_pin_hash` |
| `getProfile` | Uses safe select; logs errors |
| `getOrCreateOwnProfile` | If own profile missing → `repairUserProfile` (admin) → reload |
| `/agent`, `/agent/edit-profile` | Use `getOrCreateOwnProfile`; never show “Profile not found” for owner when repair can run |
| AuthProvider, verify-phone, agent verification, trust-status, `getAgentById/Slug` | Safe select |
| `POST /api/profile/avatar` | Ensure profile via repair; upload + `avatar_url` update via admin (same as cover) |

## Validation (founder)

After deploy to https://yike.ng:

1. Sign in → open **Account** (`/agent`) — profile loads (no “Profile not found”).
2. **Edit profile** → upload photo → success.
3. Refresh — photo still there.
4. Logout → login — photo still there.
5. Open own account again — still loads.

## Regression note

Any new `from("profiles").select("*")` on an **anon/authenticated** client will break again. Prefer `PROFILES_SAFE_SELECT` or an admin/service_role client. Admin `select("*")` remains fine (`service_role` retains pin columns).
