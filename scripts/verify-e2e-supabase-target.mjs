#!/usr/bin/env node
/**
 * Fail-closed guard for PIN-login E2E — must NOT be production Yike ref.
 * Verifies URL host matches E2E_EXPECTED_REF (you set after creating a dedicated project).
 *
 * Usage:
 *   set -a && source .env.e2e.local && set +a
 *   node scripts/verify-e2e-supabase-target.mjs
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
  const trimmed = url.trim().replace(/^["']|["']$/g, "");
  const match = trimmed.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i);
  return match?.[1]?.toLowerCase() ?? null;
}

function main() {
  if (process.env.E2E_ISOLATED_SUPABASE === "1" || existsSync(join(root, ".env.e2e.local"))) {
    loadEnvE2eLocal();
  }

  const expected = process.env.E2E_EXPECTED_REF?.trim().toLowerCase();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const otpToken = process.env.YIKE_OTP_SERVER_TOKEN?.trim();
  const actual = refFromSupabaseUrl(url);

  console.log("Yike E2E Supabase Target Guard");
  console.log(`  NEXT_PUBLIC_SUPABASE_URL host ref: ${actual ?? "(missing/invalid)"}`);
  console.log(`  E2E_EXPECTED_REF: ${expected ?? "(not set)"}`);

  if (!expected) {
    console.error("\nFAIL: Set E2E_EXPECTED_REF in .env.e2e.local to your dedicated test project ref.");
    process.exit(1);
  }
  if (expected === PRODUCTION_REF) {
    console.error("\nFAIL: E2E_EXPECTED_REF must not be production ref hlpojfurfldvcxfxhveg.");
    process.exit(1);
  }
  if (expected === RETIRED_SANDBOX_REF) {
    console.error(`\nFAIL: ${RETIRED_SANDBOX_REF} is retired — create a new Supabase project.`);
    process.exit(1);
  }
  if (!actual) {
    console.error("\nFAIL: NEXT_PUBLIC_SUPABASE_URL must be https://<ref>.supabase.co");
    process.exit(1);
  }
  if (actual === PRODUCTION_REF) {
    console.error("\nFAIL: Loaded URL points at production. Use .env.e2e.local only for E2E runs.");
    process.exit(1);
  }
  if (actual !== expected) {
    console.error(
      `\nFAIL: URL ref (${actual}) does not match E2E_EXPECTED_REF (${expected}). Wrong project.`
    );
    process.exit(1);
  }
  if (!anon || !service) {
    console.error("\nFAIL: Missing NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }
  if (!otpToken) {
    console.error(
      "\nFAIL: Missing YIKE_OTP_SERVER_TOKEN (must match yike_internal_config on the E2E project)."
    );
    process.exit(1);
  }

  const identityPath = join(root, "docs/engineering/PROJECT_IDENTITY.md");
  if (existsSync(identityPath)) {
    const md = readFileSync(identityPath, "utf8");
    const canonical = md.match(/\*\*Supabase ref\*\*\s*\|\s*`([^`]+)`/i)?.[1]?.toLowerCase();
    if (canonical && actual === canonical) {
      console.error("\nFAIL: E2E project ref matches PROJECT_IDENTITY production ref.");
      process.exit(1);
    }
  }

  console.log("\nOK: Isolated E2E Supabase target verified (non-production, ref matches expected).");
}

main();
