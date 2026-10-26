#!/usr/bin/env node
/**
 * Fail-closed guard before wallet RPC integration tests mutate data.
 * Requires YIKE_DEV_DB_INTEGRATION=1 and a non-production ref on an explicit allowlist.
 *
 * Load isolated env:
 *   set -a && source .env.e2e.local && set +a
 *   YIKE_DEV_DB_INTEGRATION=1 node scripts/verify-integration-supabase-target.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PRODUCTION_REF = "hlpojfurfldvcxfxhveg";
const RETIRED_SANDBOX_REF = "gyxemepnrkwxocgzfbeo";

function loadEnvE2eLocal() {
  const path = join(root, ".env.e2e.local");
  if (!existsSync(path)) return false;
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
  return true;
}

function refFromSupabaseUrl(url) {
  if (!url || typeof url !== "string") return null;
  const match = url.trim().match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i);
  return match?.[1]?.toLowerCase() ?? null;
}

function parseAllowlist() {
  const refs = new Set();
  const list = process.env.YIKE_INTEGRATION_ALLOWED_REFS?.trim();
  if (list) {
    for (const part of list.split(",")) {
      const ref = part.trim().toLowerCase();
      if (ref) refs.add(ref);
    }
  }
  const expected = process.env.E2E_EXPECTED_REF?.trim().toLowerCase();
  if (expected) refs.add(expected);
  return [...refs];
}

function main() {
  if (process.env.YIKE_DEV_DB_INTEGRATION !== "1") {
    console.log("Integration Supabase guard: SKIP (YIKE_DEV_DB_INTEGRATION is not 1)");
    process.exit(0);
  }

  if (process.env.E2E_ISOLATED_SUPABASE === "1" || existsSync(join(root, ".env.e2e.local"))) {
    loadEnvE2eLocal();
  }

  const ref =
    refFromSupabaseUrl(process.env.SUPABASE_URL) ??
    refFromSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const allowlist = parseAllowlist();

  console.log("Yike Integration Supabase Target Guard");
  console.log(`  YIKE_DEV_DB_INTEGRATION: 1`);
  console.log(`  URL ref:                 ${ref ?? "(missing/invalid)"}`);
  console.log(`  Allowlist:               ${allowlist.length ? allowlist.join(", ") : "(empty)"}`);

  const errors = [];

  if (!ref) {
    errors.push("Set SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL to https://<ref>.supabase.co");
  }
  if (ref === PRODUCTION_REF) {
    errors.push(`Ref ${PRODUCTION_REF} is production — integration mutations are forbidden.`);
  }
  if (ref === RETIRED_SANDBOX_REF) {
    errors.push(`Ref ${RETIRED_SANDBOX_REF} is retired.`);
  }
  if (allowlist.length === 0) {
    errors.push("Set E2E_EXPECTED_REF or YIKE_INTEGRATION_ALLOWED_REFS to your disposable test project ref.");
  }
  if (allowlist.includes(PRODUCTION_REF)) {
    errors.push("Allowlist must not include the production ref.");
  }
  if (ref && allowlist.length > 0 && !allowlist.includes(ref)) {
    errors.push(`URL ref (${ref}) is not listed in the integration allowlist.`);
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    errors.push("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  const identityPath = join(root, "docs/engineering/PROJECT_IDENTITY.md");
  if (existsSync(identityPath) && ref) {
    const md = readFileSync(identityPath, "utf8");
    const canonical = md.match(/\*\*Supabase ref\*\*\s*\|\s*`([^`]+)`/i)?.[1]?.toLowerCase();
    if (canonical && ref === canonical) {
      errors.push("Integration target matches PROJECT_IDENTITY production ref.");
    }
  }

  if (errors.length > 0) {
    console.error("\nFAIL:");
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  console.log("\nOK: Non-production integration Supabase target verified.");
}

main();
