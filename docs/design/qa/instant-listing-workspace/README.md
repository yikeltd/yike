# Instant listing workspace QA

**Route:** `/agent/listings/new`  
**Legacy:** `/agent/listings/choose` → redirect (no “What are you selling?” page)

## E2E (guest)

`e2e/instant-listing-workspace.spec.ts` — **6 passed** with `PLAYWRIGHT_SKIP_SERVER=1` on `:3000`.

## Auth return path

Login `next` preserves `category` and `hint` query params (see `login-return-vehicle-mobile.png`).

## Authenticated workspace

See **`AUTHENTICATED_VERIFICATION_REPORT.md`** for the 2026-10-27 run (blocked on production-linked `.env.local` without `.env.e2e.local`).

Specs (run when isolated env is configured):

- `e2e/instant-listing-workspace-authenticated.spec.ts`
- `e2e/listing-seller-journey-authenticated.spec.ts`
