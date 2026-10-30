#!/usr/bin/env node
/**
 * Fail-closed guard: SUPABASE_URL must match the linked Yike dev database
 * (canonical ref in config.toml / PROJECT_IDENTITY — currently hlpojfurfldvcxfxhveg).
 *
 * Does not trust env filenames — only process env URL host + optional CLI link.
 *
 * Usage:
 *   node scripts/verify-dev-supabase-target.mjs
 *   node scripts/verify-dev-supabase-target.mjs --require-dev
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const CANONICAL_REF = "hlpojfurfldvcxfxhveg";
/** Retired placeholder — DNS does not resolve; do not use. */
const RETIRED_SANDBOX_REF = "gyxemepnrkwxocgzfbeo";
const requireDev = process.argv.includes("--require-dev");

function refFromSupabaseUrl(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim().replace(/^["']|["']$/g, "");
  const match = trimmed.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i);
  return match?.[1]?.toLowerCase() ?? null;
}

function readLinkedCliRef() {
  const path = join(root, "supabase/.temp/project-ref");
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf8").trim().toLowerCase() || null;
}

function readConfigTomlRef() {
  const path = join(root, "supabase/config.toml");
  if (!existsSync(path)) return null;
  const content = readFileSync(path, "utf8");
  const match = content.match(/^project_id\s*=\s*"([^"]+)"/m);
  return match?.[1]?.toLowerCase() ?? null;
}

function main() {
  const envRef =
    refFromSupabaseUrl(process.env.SUPABASE_URL) ??
    refFromSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const linked = readLinkedCliRef();
  const configRef = readConfigTomlRef();

  console.log("Yike Dev Supabase Target Guard");
  console.log("==============================");
  console.log(`Canonical dev ref:     ${CANONICAL_REF}`);
  console.log(`config.toml project:   ${configRef ?? "(missing)"}`);
  console.log(`Process env URL ref:   ${envRef ?? "(not set)"}`);
  console.log(`Linked CLI project:    ${linked ?? "(not linked)"}`);

  const errors = [];

  if (envRef === RETIRED_SANDBOX_REF) {
    errors.push(
      `Retired sandbox ref ${RETIRED_SANDBOX_REF} — use ${CANONICAL_REF} (.env.local) for development testing.`
    );
  }

  if (configRef && configRef !== CANONICAL_REF) {
    errors.push(`config.toml project_id (${configRef}) does not match canonical ${CANONICAL_REF}.`);
  }

  if (requireDev) {
    if (!envRef) {
      errors.push(
        "SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL must be set (typically from .env.local)."
      );
    } else if (envRef !== CANONICAL_REF) {
      errors.push(`Expected dev ref ${CANONICAL_REF}, found ${envRef}.`);
    }
    if (linked && linked !== CANONICAL_REF) {
      errors.push(
        `Supabase CLI is linked to ${linked}. Run: supabase link --project-ref ${CANONICAL_REF} --yes`
      );
    }
  } else if (envRef && envRef !== CANONICAL_REF && envRef !== RETIRED_SANDBOX_REF) {
    errors.push(`Unknown Supabase ref in environment: ${envRef}`);
  }

  console.log(`Status: ${errors.length === 0 ? "PASS" : "FAIL"}`);
  if (errors.length > 0) {
    for (const e of errors) console.error(`- ${e}`);
    process.exit(1);
  }
}

main();
