# Migration history export & compare workflow

**Purpose:** Compare local `supabase/migrations/*.sql` version IDs to a remote `supabase_migrations.schema_migrations` snapshot **without** connecting the compare script to Supabase or mutating production history.

**Script:** `scripts/compare-local-migration-history.mjs`  
**npm:** `npm run compare:migrations`

---

## Safety rules

1. **Never** use production history export to justify an automated `supabase db push` on production until ops approves alignment (`YC_WALLET_MIGRATION_RECONCILIATION.md`).
2. **Never** repair production `schema_migrations` from this repo without a written runbook and backup.
3. Prefer exporting from **isolated E2E Supabase** or a **read-only SQL** session on production for evidence only.
4. If `SUPABASE_PROJECT_REF=hlpojfurfldvcxfxhveg`, the script prints a warning when comparing — that is expected for production evidence files.

---

## JSON format (required)

`MIGRATION_HISTORY_JSON` must point to a file containing a **JSON array** of objects:

```json
[
  { "version": "20261024131732", "name": "lock_down_btos_read_policies" },
  { "version": "20261024131815", "name": "yike_coins_messaging_calls" }
]
```

- `version` — 14-digit migration timestamp prefix (string).
- `name` — suffix after `_` in the local filename (no `.sql`).

The compare is **exact** on `version` + `name` pairs. Semantic equivalence with different version IDs appears as both “local only” and “remote only” rows (see reconciliation doc).

---

## Export from Supabase SQL Editor (read-only)

Run on the target project (save results; do not paste service keys into chat):

```sql
SELECT json_agg(
  json_build_object('version', version, 'name', name)
  ORDER BY version
) AS migration_history
FROM supabase_migrations.schema_migrations;
```

1. Copy the `migration_history` cell (single JSON array).
2. Save to a local file, e.g. `migration-history-snapshot.json`.
3. Validate it parses as an array in a local editor.

**Alternative (full table for spreadsheets):**

```sql
SELECT version, name
FROM supabase_migrations.schema_migrations
ORDER BY version;
```

Convert rows to the JSON array shape above if your tool exports CSV.

There is **no** bundled CLI command in this repo that connects to Supabase to export history — only this SQL + manual save, or your own audited automation outside production push paths.

---

## Run the comparison

```bash
# List local tail only (no remote file)
npm run compare:migrations

# Compare against exported history
MIGRATION_HISTORY_JSON=./migration-history-snapshot.json npm run compare:migrations
```

**Exit code:** `0` if every local file matches a remote entry and vice versa (exact pairs); `1` if any mismatch.

**Interpretation:**

| Output | Meaning |
|--------|---------|
| `Local only` | Migration file exists in repo under a version/name not in the snapshot (often local re-timestamped files vs production). |
| `Remote only` | Snapshot has versions applied on DB but no matching local file name pair. |
| Both non-empty | History **diverged** — schema may still match if SQL was applied under different IDs (`YC_WALLET_MIGRATION_RECONCILIATION.md`). |

---

## Fixture test (no Supabase)

Use the checked-in example production tail to verify the script runs and reports expected divergence against the branch:

```bash
MIGRATION_HISTORY_JSON=docs/fixtures/migration-history-production-tail.example.json \
  npm run compare:migrations
```

Expect **non-zero exit** and “local only” rows for Oct 2026 files that use different version IDs than production. This confirms the workflow without touching any database.

---

## Environment variables

| Variable | Required | Role |
|----------|----------|------|
| `MIGRATION_HISTORY_JSON` | For remote compare | Path to exported JSON array |
| `SUPABASE_PROJECT_REF` | Optional | If set to production ref, script warns when comparing |

No Supabase URL, anon key, or access token is read by `compare-local-migration-history.mjs`.

---

## Related docs

- `docs/engineering/YC_WALLET_MIGRATION_RECONCILIATION.md` — production vs local semantic pairing
- `docs/engineering/RELEASE_BLOCKER_REPORT.md` — migration alignment blocker
