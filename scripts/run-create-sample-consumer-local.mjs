/**
 * One-off local runner: load .env.local, fetch otp_server_token from linked DB (no stdout secrets).
 * Uses qa.signup@yike.ng + 08031999001 from scripts/qa-authenticated-production.mjs harness.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const CANONICAL_REF = "hlpojfurfldvcxfxhveg";

function loadEnvLocal() {
  const path = join(root, ".env.local");
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
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ref = url?.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i)?.[1]?.toLowerCase();

if (ref !== CANONICAL_REF) {
  console.error(`Refusing: Supabase ref ${ref ?? "?"} !== ${CANONICAL_REF}`);
  process.exit(1);
}
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: cfg, error: cfgErr } = await admin
  .from("yike_internal_config")
  .select("value")
  .eq("key", "otp_server_token")
  .maybeSingle();

if (cfgErr || !cfg?.value?.trim()) {
  console.error("Missing yike_internal_config.otp_server_token in linked project");
  process.exit(1);
}

process.env.YIKE_OTP_SERVER_TOKEN = cfg.value.trim();
process.env.YIKE_SAMPLE_CONSUMER_EMAIL =
  process.env.YIKE_SAMPLE_CONSUMER_EMAIL?.trim() || "qa.signup@yike.ng";
process.env.YIKE_SAMPLE_CONSUMER_PHONE =
  process.env.YIKE_SAMPLE_CONSUMER_PHONE?.trim() || "08031999001";
process.env.YIKE_CREDENTIALS_FILE =
  process.env.YIKE_CREDENTIALS_FILE?.trim() || join(root, ".local-test-credentials.txt");

const result = spawnSync("npx", ["tsx", "scripts/create-sample-consumer.ts"], {
  cwd: root,
  env: process.env,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
