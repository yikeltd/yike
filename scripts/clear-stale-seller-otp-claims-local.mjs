#!/usr/bin/env node
/**
 * Local-only: expire in-flight `pending:*` seller OTP claims (does not delete rows or reset global limits).
 *
 *   node scripts/clear-stale-seller-otp-claims-local.mjs --user-id <uuid>
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvFile(name) {
  try {
    const text = readFileSync(join(__dirname, "..", name), "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq);
      let val = trimmed.slice(eq + 1);
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    /* optional */
  }
}

loadEnvFile(".env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  if (process.env.YIKE_ALLOW_LOCAL_OTP_CLAIM_CLEAR !== "true") {
    console.error(
      "Set YIKE_ALLOW_LOCAL_OTP_CLAIM_CLEAR=true to confirm local stale-claim cleanup.",
    );
    process.exit(1);
  }
  if (process.env.NODE_ENV === "production") {
    console.error("Refusing: local dev only.");
    process.exit(1);
  }

  const userId = arg("--user-id")?.trim();
  if (!userId || !url || !serviceKey) {
    console.error("Usage: YIKE_ALLOW_LOCAL_OTP_CLAIM_CLEAR=true node ... --user-id <uuid>");
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("whatsapp_otp_sessions")
    .update({ status: "expired", consumed_at: now })
    .eq("user_id", userId)
    .eq("status", "sent")
    .like("provider_reference", "pending:%")
    .select("id");

  if (error) {
    console.error("Update failed:", error.message);
    process.exit(1);
  }

  console.log(
    JSON.stringify({ expiredPendingClaims: (data ?? []).length, userIdPrefix: userId.slice(0, 8) }),
  );
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
