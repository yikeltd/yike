# Development E2E certification (Yike Supabase)

Yike uses **one linked Supabase project** for pre-launch development and certification:

| Field | Value |
|-------|--------|
| **Project ref** | `hlpojfurfldvcxfxhveg` |
| **Dashboard** | https://supabase.com/dashboard/project/hlpojfurfldvcxfxhveg |
| **Local env** | `.env.local` (gitignored) |

The former sandbox ref `gyxemepnrkwxocgzfbeo` is **retired** (no DNS / no org project). Do not configure it.

## Before any database command

```bash
npm run verify:supabase-project -- --require-linked
npm run verify:dev-target
```

The dev guard reads **process env URLs**, not filenames. Load credentials first:

```bash
set -a && source .env.local && set +a
npm run verify:dev-target
```

## Applying new migrations (founder / lead only)

Inspect SQL under `supabase/migrations/` first. Push only when additive and understood:

```bash
set -a && source .env.local && set +a
npm run verify:supabase-project -- --require-linked
npm run verify:dev-target
ALLOW_PRODUCTION_DB_PUSH=1 npm run db:push
```

`ALLOW_PRODUCTION_DB_PUSH=1` is a deliberate ack that the **linked dev database** will change (same ref as production hosting — pre-launch, not a separate clone).

**Never** `db reset`, truncate business tables, or run seeds against real customer data without explicit approval.

## Database-backed integration tests

Uses isolated auth users and ledger keys prefixed `dev-integration:`.

```bash
set -a && source .env.local && set +a
YIKE_DEV_DB_INTEGRATION=1 npm run verify:dev-target
YIKE_DEV_DB_INTEGRATION=1 npm run test:dev:integration
```

Optional: `YIKE_DEV_TEST_USER_ID` — existing profile UUID; otherwise tests create ephemeral `@yike.dev.invalid` users and delete them after.

## Video / Yike Coins manual checks

1. `npm run dev` — buyer starts call from listing inquiry; seller sees **Incoming** sheet (global host).
2. Exercise decline, missed (ring timeout), cancel, end — all via `/api/video-calls/[id]/finalize`.
3. SQL (dashboard): `video_call_sessions`, `video_call_free_allowance_claims`, `video_call_daily_usage`.

Paid video remains off until platform pricing and refund policy are approved.

## Playwright (local app)

```bash
npm run dev
npm run test:e2e:local
```
