# YC wallet & Oct 2026 migration reconciliation

**Project:** `hlpojfurfldvcxfxhveg` (production — read-only inspection only)  
**Branch:** `feat/unified-three-vertical-marketplace`  
**Date:** 2026-10-26  
**Status:** Peer-transfer **repository defect repaired** (2026-10-26) — production **history reconciliation still ops-owned**. **Do not run `supabase db push` to production** until controlled history alignment.

---

## Summary

| Question | Answer |
|----------|--------|
| Is production **schema** missing YC wallet / messaging fixes? | **No** — live objects match expected capabilities (see live checks below). |
| Is **migration history** aligned with the branch? | **No** — 14 local files use version IDs that are **not** in `supabase_migrations.schema_migrations` on production; production instead records 13 different version IDs for the same era. |
| Would a naive `db push` be safe? | **No** — CLI would attempt to apply local-only versions (duplicate DDL / replace functions). Local `20261026150000_peer_transfer_idempotency_recipient.sql` would **regress** the live `yike_coin_peer_transfer` definition (drops `-IN` ledger suffix). |
| Is isolated E2E migration apply safe as-is? | **Risky** — fresh DB applying all local files in order ends on `261500`, not on the production-equivalent function body. |

---

## Evidence sources

1. **Production migration history** — `supabase_migrations.schema_migrations` (Supabase MCP / SQL), versions `>= 20261024`.
2. **Local migration files** — `supabase/migrations/*.sql` (148 files).
3. **Live production schema** — read-only SQL against `public` (tables, triggers, function body fingerprints). No data mutation.

---

## Production applied tail (canonical record)

| Version | Name |
|---------|------|
| `20261024131732` | `lock_down_btos_read_policies` |
| `20261024131815` | `yike_coins_messaging_calls` |
| `20261024131823` | `yike_coins_messaging_calls_rpcs` |
| `20261024131829` | `yike_coins_hardening_core` |
| `20261024131832` | `yike_coins_hardening_video_allowance` |
| `20261024135221` | `revoke_anon_yike_coin_video_rpc` |
| `20261024135657` | `universal_listing_foundation` |
| `20261024143304` | `harden_phone_otp_rpc_grants` |
| `20261024143310` | `otp_ip_rate_limit_foundation` |
| `20261025175331` | `fix_profile_set_username_ambiguous` |
| `20261025194900` | `peer_transfer_distinct_ledger_references` |
| `20261025194913` | `peer_transfer_distinct_ledger_references_v2` |

**Count:** 12 versions after `20260730190000` on production.

---

## Local branch tail (same era, different version IDs)

These local files are **not** recorded on production under these version numbers:

| Local version | File | Semantic pairing on prod |
|---------------|------|---------------------------|
| `20261006120000` | `lock_down_btos_read_policies.sql` | → `20261024131732` (same name) |
| `20261013120000` | `universal_listing_foundation.sql` | → `20261024135657` |
| `20261023180000` | `yike_coins_messaging_calls.sql` | → split `20261024131815` + related |
| `20261023210000` | `yike_coins_hardening.sql` | → split `20261024131829` / `31832` / RPC bundle |
| `20261024140000` | `revoke_anon_yike_coin_video_rpc.sql` | → `20261024135221` |
| `20261024160000` | `harden_phone_otp_rpc_grants.sql` | → `20261024143304` |
| `20261024161000` | `otp_ip_rate_limit_foundation.sql` | → `20261024143310` |
| `20261024162000` | `sms_only_phone_verification_note.sql` | COMMENT only (see live check) |
| `20261025120000` | `marketplace_message_client_id.sql` | Applied on prod (column exists); **no migration row** |
| `20261026120000` | `yc_transfers_admin_grants.sql` | Applied on prod (tables/RPC); **no migration row** |
| `20261026140000` | `profile_username_change_guard.sql` | Applied on prod (trigger); **no migration row** |
| `20261026141000` | `fix_profile_set_username_ambiguous.sql` | → `20261025175331` (same fix, different timestamp) |
| `20261026142000` | `peer_transfer_distinct_ledger_references.sql` | → `20261025194900` (+ v2) |
| `20261026150000` | `peer_transfer_idempotency_recipient.sql` | **Partially** reflected in prod v2; file content **does not** match live function |

**Root cause:** Production received SQL via CLI pushes that **split and re-timestamped** migrations (`202610241318xx`). The branch later **consolidated and renumbered** the same work under `20261006` / `20261013` / `20261023` / `20261026` filenames. Some production changes (client message id, admin grants, username guard) were applied **without** a matching local version ID in `schema_migrations`.

---

## Live production schema checks (2026-10-26)

| Capability | Live on prod? | Evidence |
|------------|---------------|----------|
| `yike_coin_transfers` | Yes | `to_regclass` |
| `yike_coin_admin_grants` + `yike_coin_admin_grant()` | Yes | table + `pg_proc` |
| Peer transfer `-IN` credit reference | Yes | `prosrc` contains `\|\| '-IN'` |
| Peer transfer recipient idempotency | Yes | `prosrc` contains `v_existing.recipient_id <> v_recipient_id` |
| Idempotency style | `IF FOUND` | matches `20261026142000`, **not** `20261026150000` (`v_existing.id IS NOT NULL` absent on prod) |
| `marketplace_messages.client_message_id` + dedupe index | Yes | column + `marketplace_messages_client_dedupe_idx` |
| Username change guard | Yes | trigger `yike_profile_username_guard`, `yike_profile_guard_username_update` |
| SMS OTP table comment | Yes | `whatsapp_otp_sessions` comment matches `20261024162000` SQL |

**Conclusion:** Production **behavior** for YC wallet + messaging idempotency is ahead of what a **fresh** database would get if it applied local files through `20261026150000` only.

---

## Repository repair (2026-10-26)

| Action | File | Purpose |
|--------|------|---------|
| **Fixed** | `20261026150000_peer_transfer_idempotency_recipient.sql` | Replaced defective body; now matches `261420` (`-IN`, `IF FOUND`, recipient idempotency). Fresh chains that run `261420` → `261500` converge on the correct function. |
| **Added** | `20261026151000_peer_transfer_restore_in_credit_reference.sql` | Forward-only `CREATE OR REPLACE` for databases that **already recorded** `261500` while it still dropped `-IN`. Idempotent on correct DBs. |
| **Tests** | `src/lib/__tests__/peer-transfer-migration-canonical.test.ts` | Static SQL guards on all three peer-transfer migrations. |
| **Tests** | `scripts/staging-integration/yike-coins-staging.integration.test.ts` | Ledger `-IN` convention + recipient idempotency mismatch (DB integration — run on non-prod only). |
| **Tool** | `npm run compare:migrations` | Read-only local vs supplied `MIGRATION_HISTORY_JSON` diff. |

**Not changed:** production `schema_migrations` rows, production live function (already correct via `202610251949*`).

---

## Critical branch defect (historical — fixed in repo)

Previously, `20261026150000` replaced the function and **removed** the `-IN` credit reference. That regression is **corrected in git**; databases that applied the old `261500` body need migration **`261510`** applied once.

---

## Safe resolution plan (remaining ops work)

### Phase 1 — Align repo with reality (founder/engineering)

1. **Treat production `schema_migrations` as SSOT for version IDs** already applied on `hlpojfurfldvcxfxhveg`.
2. **Done (repo):** peer-transfer migration repair + `261510` forward fix.
3. **Still open:** rename/repair migration **version ID** alignment for Oct 2026 tail (local `20261006`/`20261023`/`20261026*` vs prod `202610241318xx` / `202610251949*`). Use `npm run compare:migrations` with exported non-prod or prod history JSON — **do not auto-mark applied on prod**.
4. **Document** `marketplace_message_client_id`, `yc_transfers_admin_grants`, and `profile_username_change_guard` as applied-on-prod-without-row OR backfill `schema_migrations` via controlled SQL Editor insert **only** after confirming byte-for-byte apply (founder approval).

### Phase 2 — Production history backfill (ops, not agent)

- **Never** re-run consolidated local files against production.
- If history rows are missing but schema matches: insert migration version rows **without** re-executing SQL (repair workflow), using production’s actual applied IDs (`20261025194913` as head for peer transfer).
- If any semantic diff remains between live `prosrc` and repo: ship **one new** forward migration with a **new** timestamp (`supabase migration new …`).

### Phase 3 — Isolated E2E project

- After Phase 1 repair, apply migrations from clean checkout to new project only.
- Run `YIKE_DEV_DB_INTEGRATION=1` integration suite against **isolated** ref, not production.

---

## What not to do

- Do **not** `supabase db push` to `hlpojfurfldvcxfxhveg` from current branch tip.
- Do **not** assume 14/14 integration tests on linked production ref prove migration history is clean.
- Do **not** delete production migration rows.

---

## Verification (2026-10-26 repair slice)

| Check | Result |
|-------|--------|
| Static peer-transfer migration tests | **3/3 PASS** (`peer-transfer-migration-canonical.test.ts`) |
| `npx tsc --noEmit` / `npm run build` | **PASS** (2026-10-26 repair slice) |
| DB integration (`test:dev:integration`) | **NOT RUN** — `verify:dev-target` = production ref; run on isolated Supabase only |
| Fresh/isolated migrate | **Unverified** until isolated project exists |

---

## References

- `supabase/migrations/20261026120000_yc_transfers_admin_grants.sql`
- `supabase/migrations/20261026142000_peer_transfer_distinct_ledger_references.sql`
- `supabase/migrations/20261026150000_peer_transfer_idempotency_recipient.sql`
- `scripts/staging-integration/yike-coins-staging.integration.test.ts`
- `docs/engineering/RELEASE_BLOCKER_REPORT.md`
