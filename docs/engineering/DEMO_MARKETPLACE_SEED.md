# Demo marketplace seed (dev/sandbox only)

Idempotent script that inserts **test-only** property + vehicle inventory for internal discovery testing.

**Never run against production** (`hlpojfurfldvcxfxhveg`) unless you intentionally set `ALLOW_PRODUCTION_SEED=1` (default: refused).

## Script

`scripts/seed-demo-marketplace.ts`

## What it seeds

| Kind | Count | Notes |
|------|------:|-------|
| Sellers | 4 | Private, Verified Seller, Dealer, Agency |
| Properties | 10 | Enugu → Asaba city mix; rent/sale/land; ≥3 boosted |
| Vehicles | 10 | Toyota…Isuzu mix; sedan/SUV/pickup/bus/moto/truck; ≥3 boosted |

Every listing is tagged:

- Title prefix `[DEMO]`
- `attributes.is_demo = true`
- `attributes.seed_namespace = yike-demo-marketplace-v1`
- Stable UUIDs (upsert-safe; does not overwrite non-demo rows)

Images use Unsplash placeholders already used by the repo’s mock seed path — marked as demo media in `media_items.alt_text` / attributes.

## Safety guards

1. Parses project ref from `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`
2. If ref === `hlpojfurfldvcxfxhveg` and `ALLOW_PRODUCTION_SEED` ≠ `1` → **exit 2, no writes**
3. Upserts only stable demo IDs
4. `--purge-demo` deletes only those IDs / `is_demo` + namespace rows

## How to run (sandbox)

```bash
# 1) Point env at sandbox (example) or local Supabase — NOT production
export SUPABASE_URL="https://gyxemepnrkwxocgzfbeo.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<sandbox-service-role>"

# 2) Dry-run (always first)
npx tsx scripts/seed-demo-marketplace.ts --dry-run

# 3) Seed
npx tsx scripts/seed-demo-marketplace.ts

# 4) Re-validate discovery counts
npx tsx scripts/seed-demo-marketplace.ts --validate-only

# Optional: remove demo rows only
npx tsx scripts/seed-demo-marketplace.ts --purge-demo
```

Or via npm:

```bash
npm run seed:demo -- --dry-run
npm run seed:demo
```

## Local Supabase

```bash
npx supabase start
export SUPABASE_URL="http://127.0.0.1:54321"
export SUPABASE_SERVICE_ROLE_KEY="<local service_role from supabase status>"
npx tsx scripts/seed-demo-marketplace.ts
```

## Expected validation

After a successful seed against a safe DB:

- Homepage property rails can load `status=approved` + `asset_type=PROPERTY` demo rows
- `/vehicles` can load `asset_type=VEHICLE` demo rows
- Search finds `[DEMO]` titles
- Admin listings console can filter by vertical and see boosted flags

## Related

- Legacy bulk property SQL/API seed: `scripts/seed-supabase.ts` (different purpose; still respect production caution)
- Project identity: `docs/engineering/PROJECT_IDENTITY.md`
