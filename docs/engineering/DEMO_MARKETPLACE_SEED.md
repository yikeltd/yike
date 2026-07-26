# Demo / sample marketplace seed

Idempotent script that inserts **sample** property + vehicle inventory for discovery testing and launch-validation load testing.

**Never run against production** (`hlpojfurfldvcxfxhveg`) unless the founder explicitly sets `ALLOW_PRODUCTION_SEED=1` (default: refused).

**Preferred:** run the full catalog on **staging/sandbox** (`gyxemepnrkwxocgzfbeo`). Do not treat fake inventory as a substitute for real supply on yike.ng. See [LAUNCH_VALIDATION_DATASET.md](../launch/LAUNCH_VALIDATION_DATASET.md).

## Script

| Path | Role |
|------|------|
| `scripts/seed-demo-marketplace.ts` | Upsert / purge / validate |
| `scripts/lib/launch-validation-catalog.ts` | Generated nationwide catalog |

```bash
npm run seed:demo:dry
npm run seed:demo
```

## What it seeds (dry-run 2026-07-26)

| Kind | Count | Notes |
|------|------:|-------|
| Sellers | 12 | 4 handcrafted + 8 agencies/dealers |
| Properties | **300** | 18 handcrafted + ~282 generated |
| Vehicles | **134** | 14 handcrafted + ~120 generated |

Coverage: Lagos, Abuja, Port Harcourt, Enugu, Ibadan, Benin City, Owerri, Uyo, Asaba, Aba, Kaduna, Kano, Jos (+ handcrafted outliers).

Every listing is tagged:

- **No public `[DEMO]` title prefix** (clean marketplace titles)
- `attributes.is_sample = true`
- `attributes.is_demo = true` (legacy purge compatibility)
- `attributes.seed_namespace = yike-demo-marketplace-v1`
- Stable UUIDs (upsert-safe; does not overwrite non-demo rows)

**Public UI:** never shows Sample / DEMO badges.  
**Admin:** shows “Sample Listing”; one-click / bulk remove via `/api/admin/sample-listings` or `--purge-demo`.

Images use Unsplash placeholders — **not** Media Protection Pipeline uploads.

## Empty production without seeding

If production has **0 published listings**, the app fills homepage rails with **UI-only fixtures** (`src/lib/demo-ui-fixtures.ts`) — no DB writes. Disable with `YIKE_EMPTY_INVENTORY_FIXTURES=0` or `YIKE_DISABLE_DEMO_UI=1`.

## Safety guards

1. Parses project ref from `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`
2. If ref === `hlpojfurfldvcxfxhveg` and `ALLOW_PRODUCTION_SEED` ≠ `1` → **exit 2, no writes**
3. Upserts only stable demo IDs
4. `--purge-demo` deletes only those IDs / `is_demo` + namespace rows

## How to run (sandbox)

```bash
export SUPABASE_URL="https://gyxemepnrkwxocgzfbeo.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<sandbox-service-role>"

npx tsx scripts/seed-demo-marketplace.ts --dry-run
npx tsx scripts/seed-demo-marketplace.ts
npx tsx scripts/seed-demo-marketplace.ts --validate-only
npx tsx scripts/seed-demo-marketplace.ts --purge-demo
```

## Production (founder confirm only)

```bash
# Dry-run first (safe)
npx tsx --env-file=.env.local scripts/seed-demo-marketplace.ts --dry-run

# Explicit write (founder confirmation required — not recommended for soft-launch)
ALLOW_PRODUCTION_SEED=1 npx tsx --env-file=.env.local scripts/seed-demo-marketplace.ts
```

## Related

- Launch validation report: `docs/launch/LAUNCH_VALIDATION_DATASET.md`
- UI fixtures: `src/lib/demo-ui-fixtures.ts`
- Admin purge: `POST /api/admin/sample-listings`
