#!/usr/bin/env node
/**
 * Local-only: summarize seller SMS rate-limit state without printing phones, OTPs, or keys.
 *
 *   node scripts/seller-otp-rate-limit-diagnostic-local.mjs --user-id <uuid>
 *   node scripts/seller-otp-rate-limit-diagnostic-local.mjs --email qa.signup@yike.ng
 */
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HOUR_MS = 60 * 60 * 1000;
const MAX_SENDS = 3;

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

function countsTowardLimit(row) {
  const ref = (row.provider_reference ?? "").trim();
  if (row.status === "expired") return false;
  if (!ref || ref.startsWith("pending:")) return false;
  return row.status === "sent" || row.status === "verified";
}

function phoneFingerprint(phoneIntl) {
  return createHash("sha256").update(phoneIntl).digest("hex").slice(0, 12);
}

loadEnvFile(".env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.error("Refusing: run only on local dev (NODE_ENV !== production).");
    process.exit(1);
  }
  if (!url || !serviceKey) {
    console.error("Missing Supabase URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let userId = arg("--user-id")?.trim();
  const email = arg("--email")?.trim()?.toLowerCase();
  if (!userId && email) {
    const { data, error } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (error || !data?.id) {
      console.error("Could not resolve profile for email (no PII logged).");
      process.exit(1);
    }
    userId = data.id;
  }
  if (!userId) {
    console.error("Usage: --user-id <uuid> | --email <address>");
    process.exit(1);
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("phone, normalized_phone")
    .eq("id", userId)
    .maybeSingle();

  const since = new Date(Date.now() - HOUR_MS).toISOString();
  const { data: sessions, error } = await admin
    .from("whatsapp_otp_sessions")
    .select("status, provider_reference, created_at, phone_intl")
    .eq("user_id", userId)
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Session query failed:", error.message);
    process.exit(1);
  }

  const rows = sessions ?? [];
  let providerAccepted = 0;
  let failedOrPending = 0;
  const byStatus = {};
  for (const row of rows) {
    byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
    if (countsTowardLimit(row)) providerAccepted += 1;
    else failedOrPending += 1;
  }

  const phoneIntl = rows[0]?.phone_intl ?? null;
  const legacyWouldBlock = rows.length >= MAX_SENDS;
  const currentWouldBlock = providerAccepted >= MAX_SENDS;

  console.log(
    JSON.stringify(
      {
        userIdPrefix: userId.slice(0, 8),
        phoneFingerprint: phoneIntl ? phoneFingerprint(phoneIntl) : null,
        profileHasPhone: Boolean(profile?.phone || profile?.normalized_phone),
        lastHour: {
          totalSessionRows: rows.length,
          providerAcceptedSends: providerAccepted,
          failedOrPendingClaims: failedOrPending,
          byStatus,
        },
        rateLimit: {
          maxPerPhoneHour: MAX_SENDS,
          blockedByLegacyCounter: legacyWouldBlock,
          blockedByFixedCounter: currentWouldBlock,
          likelyFalseLockout: legacyWouldBlock && !currentWouldBlock,
        },
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
