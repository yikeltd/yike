#!/usr/bin/env node
/**
 * Ops smoke test for OTP + notifications health (uses Vercel production env).
 * Usage: vercel env run -- node scripts/verify-otp-production.mjs
 */

const base = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://yike.ng";
const cron = process.env.CRON_SECRET?.trim();

async function main() {
  const results = { base, checks: {} };

  if (!cron) {
    results.checks.cronSecret = { ok: false, error: "CRON_SECRET missing" };
    console.log(JSON.stringify(results, null, 2));
    process.exit(1);
  }

  const healthRes = await fetch(`${base}/api/health/notifications`, {
    headers: { Authorization: `Bearer ${cron}` },
  });
  results.checks.health = {
    ok: healthRes.ok,
    status: healthRes.status,
    body: await healthRes.json().catch(() => null),
  };

  const sendchampKey =
    process.env.SENDCHAMP_PUBLIC_KEY?.trim() ||
    process.env.SENDCHAMP_API_KEY?.trim() ||
    "";
  results.checks.sendchampKeyPresent = Boolean(sendchampKey);
  results.checks.sendchampSmsSender =
    process.env.SENDCHAMP_SMS_SENDER?.trim() || "Yike (default)";
  results.checks.sendchampBaseUrl =
    process.env.SENDCHAMP_LIVE_BASE_URL?.trim() ||
    "https://api.sendchamp.com/api/v1 (default)";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (url && serviceKey) {
    const { createClient } = await import("@supabase/supabase-js");
    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error } = await admin.from("phone_otp_requests").select("id").limit(1);
    results.checks.supabaseAdminInsert = {
      ok: !error,
      error: error?.message ?? null,
    };
  } else {
    results.checks.supabaseAdminInsert = {
      ok: false,
      error: "Missing Supabase URL or service role key",
    };
  }

  const allOk =
    results.checks.health.ok &&
    results.checks.health.body?.supabaseAdminConfigured &&
    results.checks.sendchampKeyPresent &&
    results.checks.supabaseAdminInsert.ok;

  results.ok = allOk;
  console.log(JSON.stringify(results, null, 2));
  process.exit(allOk ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
