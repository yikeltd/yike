# Instant listing workspace QA

**Route:** `/agent/listings/new`  
**Legacy:** `/agent/listings/choose` → redirect (no “What are you selling?” page)

## E2E (guest)

`e2e/instant-listing-workspace.spec.ts` — **6 passed** with `PLAYWRIGHT_SKIP_SERVER=1` on `:3000`.

## Auth return path

Login `next` preserves `category` and `hint` query params (see `login-return-vehicle-mobile.png`).

## Authenticated workspace

`e2e/listing-seller-journey-authenticated.spec.ts` requires `E2E_EPHEMERAL_AUTH=1` or agent credentials — skipped when unset.
