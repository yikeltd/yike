# Founder Action: Leaked Password Protection

**Date:** 2026-07-24  
**Phase:** 5 (Supabase Security Audit)  
**Status:** **Manual Dashboard step required** — cannot be fully enabled via SQL migration

---

## What it is

Supabase Auth can reject passwords known to be compromised (Have I Been Pwned integration). This reduces credential-stuffing risk for users who choose common or leaked passwords.

---

## Why migration cannot enable it

Leaked password protection is an **Auth project setting**, not a Postgres object. It is configured through the Supabase Dashboard or Management API with appropriate project permissions — not through standard migration SQL run against the database.

**Do not claim this is enabled until verified in Dashboard.**

---

## Steps for founder

1. Open [Supabase Dashboard](https://supabase.com/dashboard/project/hlpojfurfldvcxfxhveg)
2. Navigate to **Authentication** → **Providers** → **Email** (or **Auth** → **Password Security** depending on Dashboard version)
3. Enable **Leaked password protection** (may appear as “Prevent use of leaked passwords” or HIBP check)
4. Save changes
5. Optional smoke test: attempt signup with a known weak/leaked test password (e.g. from HIBP test vectors) and confirm rejection

---

## Management API alternative (optional)

If automating via CI or scripts with a personal access token:

```bash
# Requires SUPABASE_ACCESS_TOKEN with project settings scope
# Exact endpoint varies by API version — confirm in Supabase docs before running
curl -X PATCH "https://api.supabase.com/v1/projects/hlpojfurfldvcxfxhveg/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"SECURITY_UPDATE_PASSWORD_REQUIREMENTS": true}'
```

**Note:** Field names change between API versions. Prefer Dashboard until API payload is confirmed against current docs.

---

## Impact on Yike

- Yike uses **email OTP-first** auth; many users may never set a password
- Still valuable for any password-based flows, staff accounts, or future password login
- No app code changes required when enabled

---

## Verification

After enabling, Supabase Database Linter → Auth section should show leaked password protection as **enabled**.

Document completion date and screenshot in this file or `SECURITY_VALIDATION_REPORT.md` when done.
