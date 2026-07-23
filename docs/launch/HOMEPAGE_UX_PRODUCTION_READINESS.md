# Production Readiness — Homepage UX + Ads

**Status:** Code ready · **Migration pending founder** · **No commit**

## GO when

1. Founder reviews UI locally at `http://localhost:3000/`
2. Migration `20260723170007_homepage_ad_slots_v1.sql` applied on production Supabase
3. Smoke: create enabled slot-1 campaign in `/lex/auth/advertising` → appears on `/` between Featured and Recently Added
4. Smoke: disable campaign → gap disappears
5. Smoke: header has no List; Sell still in bottom nav; location persists after reload

## NO-GO if

- Migration not applied (slot creates fail)
- Empty “Advertise here” placeholders appear (should not — code returns null)

## Checks run

- `npm run verify:supabase-project -- --require-linked` — PASS (`hlpojfurfldvcxfxhveg`)
- `npx tsc --noEmit` — PASS
- **No commit / no push** (per founder)

## Env

No new secrets or Coolify env vars required.

## Files changed (high level)

Headers, location chip, browse density, homepage rails + ads, advertisements constants/service/public/API/admin board, creative specs, revenue pricing defaults, migration, docs.
