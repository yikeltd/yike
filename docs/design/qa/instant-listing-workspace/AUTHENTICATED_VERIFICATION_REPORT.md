# Authenticated listing workflow verification — 2026-10-27

## Blocker (this machine)

Authenticated Playwright **did not run** against a live seller session.

| Prerequisite | Status |
|--------------|--------|
| `.env.e2e.local` | **Missing** (`cp .env.e2e.example .env.e2e.local`) |
| `NEXT_PUBLIC_SUPABASE_URL` in use | **`hlpojfurfldvcxfxhveg` (production)** |
| `E2E_EPHEMERAL_AUTH=1` | **Unset** |
| `E2E_AGENT_EMAIL` / password | **Unset** |

`ephemeralAuthEnabled()` **refuses production** (`e2e/helpers/ephemeral-auth.ts`). Creating/deleting test users or mutating listing data on production is intentionally blocked.

### Unblock (founder / CI)

1. Create or use a **non-production** Supabase project (not `hlpojfurfldvcxfxhveg`).
2. `cp .env.e2e.example .env.e2e.local` — set URL, anon, service role, `E2E_EXPECTED_REF`, `YIKE_OTP_SERVER_TOKEN`.
3. Apply migrations to that project; `npm run verify:e2e-supabase`.
4. Run dev with isolated env: `set -a && source .env.e2e.local && set +a && npm run dev`
5. Execute:
   ```bash
   E2E_ISOLATED_SUPABASE=1 E2E_EPHEMERAL_AUTH=1 PLAYWRIGHT_SKIP_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 \
     npx playwright test e2e/instant-listing-workspace-authenticated.spec.ts e2e/listing-seller-journey-authenticated.spec.ts --workers=1
   ```

Ephemeral lister users use `@ephemeral.yike.test` emails (created/deleted via service role; no credentials stored in repo).

## Guest verification (completed earlier)

- `e2e/instant-listing-workspace.spec.ts` — **6/6 passed**
- Login `next` preserves `category` + `hint` (743b85eb)

## Specs ready for authenticated run

- `e2e/instant-listing-workspace-authenticated.spec.ts` — login return, 3 verticals mobile/desktop, smart-describe no-overwrite, photo file attach, category switch
- `e2e/listing-seller-journey-authenticated.spec.ts` — smoke workspace + draft reload

**Publish:** specs do **not** submit listings for moderation/live publish.
