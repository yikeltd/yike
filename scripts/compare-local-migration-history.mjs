#!/usr/bin/env node
/**
 * Read-only: compare local supabase/migrations version IDs to a supplied history file.
 *
 * Usage:
 *   node scripts/compare-local-migration-history.mjs
 *   MIGRATION_HISTORY_JSON=./path/to/history.json node scripts/compare-local-migration-history.mjs
 *
 * history.json shape: [{ "version": "20261026142000", "name": "peer_transfer_..." }, ...]
 *
 * Does not connect to Supabase, mutate history, or print secrets.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = join(root, "supabase/migrations");
const PRODUCTION_REF = "hlpojfurfldvcxfxhveg";

function localMigrations() {
  return readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .map((f) => {
      const i = f.indexOf("_");
      return {
        version: f.slice(0, i),
        name: f.slice(i + 1, -4),
        file: f,
      };
    })
    .sort((a, b) => a.version.localeCompare(b.version));
}

function loadHistoryJson() {
  const path = process.env.MIGRATION_HISTORY_JSON?.trim();
  if (!path) return null;
  if (!existsSync(path)) {
    console.error(`FAIL: MIGRATION_HISTORY_JSON not found: ${path}`);
    process.exit(1);
  }
  const raw = JSON.parse(readFileSync(path, "utf8"));
  if (!Array.isArray(raw)) {
    console.error("FAIL: history JSON must be an array of { version, name }");
    process.exit(1);
  }
  return raw.map((row) => ({
    version: String(row.version),
    name: String(row.name ?? ""),
  }));
}

function main() {
  const local = localMigrations();
  const remote = loadHistoryJson();

  console.log("Local migration files:", local.length);
  if (!remote) {
    console.log("");
    console.log("No MIGRATION_HISTORY_JSON set — listing local tail (>= 20261006):");
    for (const row of local.filter((r) => r.version >= "20261006120000")) {
      console.log(`  ${row.version}  ${row.name}`);
    }
    console.log("");
    console.log(
      "To compare remotely: export history from non-production schema_migrations, save as JSON, then:",
    );
    console.log("  MIGRATION_HISTORY_JSON=./history.json node scripts/compare-local-migration-history.mjs");
    if (process.env.SUPABASE_PROJECT_REF?.trim() === PRODUCTION_REF) {
      console.error("");
      console.error("WARN: SUPABASE_PROJECT_REF is production — do not use prod history for automated push decisions.");
    }
    return;
  }

  const remoteSet = new Set(remote.map((r) => `${r.version}\t${r.name}`));
  const localSet = new Set(local.map((r) => `${r.version}\t${r.name}`));

  const onlyLocal = local.filter((r) => !remoteSet.has(`${r.version}\t${r.name}`));
  const onlyRemote = remote.filter((r) => !localSet.has(`${r.version}\t${r.name}`));

  console.log("Remote history entries:", remote.length);
  console.log("");
  console.log("Local only (by exact version+name):", onlyLocal.length);
  for (const r of onlyLocal.filter((x) => x.version >= "20261006120000")) {
    console.log(`  ${r.version}  ${r.name}`);
  }
  console.log("");
  console.log("Remote only (by exact version+name):", onlyRemote.length);
  for (const r of onlyRemote.filter((x) => x.version >= "20261006120000")) {
    console.log(`  ${r.version}  ${r.name}`);
  }

  if (onlyLocal.length > 0 || onlyRemote.length > 0) {
    process.exitCode = 1;
  }
}

main();
