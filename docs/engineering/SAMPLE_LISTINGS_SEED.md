# Sample listings seed (30 items)

Handcrafted **10 property · 10 vehicle · 10 electronics** listings for local dev and safe sandbox demos.

## Seed to Supabase (idempotent)

```bash
# Plan only (no writes)
npm run seed:sample-listings:dry

# Writes (sandbox/local service role only)
npx tsx --env-file=.env.local scripts/seed-sample-listings.ts

# Remove stable sample rows
npx tsx --env-file=.env.local scripts/seed-sample-listings.ts --purge
```

**Safety:** Refuses production project `hlpojfurfldvcxfxhveg` unless `ALLOW_PRODUCTION_SEED=1`.

**Markers:** `attributes.is_demo`, `attributes.is_sample`, `attributes.seed_namespace=yike-sample-listings-v1`, stable UUIDs under `s3000001-…`.

## Offline UI fixture (no database)

In `.env.local` (development only):

```bash
YIKE_SAMPLE_LISTINGS_FIXTURE=1
```

Optional — force the full catalog even when production returns live rows (still dev-only, still labelled):

```bash
YIKE_SAMPLE_LISTINGS_FIXTURE_FORCE=1
```

Put each variable on its **own line** in `.env.local`. Restart `npm run dev` after changes.

When live inventory is empty (or force mode is on), routes use the 30-item in-memory catalog and show a **Sample listings (dev fixture)** banner. Fixtures are **never** used when Supabase fetches fail on the homepage (`fetchHealth.failed`).

## Catalog source

`src/lib/sample-listings/catalog.ts` — titles, slugs, prices, locations, Unsplash media URLs.
