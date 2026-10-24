import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";

const OTP_RPC_SIGNATURES = [
  "yike_otp_latest(text, text)",
  "yike_otp_insert_pending(text, text, text, timestamptz, text, text, timestamptz)",
  "yike_otp_insert_pending(text, text, text, timestamptz, text, text, timestamptz, text)",
  "yike_otp_mark_sent(text, uuid, text, text)",
  "yike_otp_mark_failed(text, uuid, text)",
  "yike_otp_mark_expired(text, uuid)",
  "yike_otp_increment_attempts(text, uuid)",
  "yike_otp_verify_success(text, uuid, text)",
  "yike_otp_find_verified(text, text, text)",
  "yike_otp_log_event(text, text, text, text, int, timestamptz, text)",
  "yike_otp_last_sent_at(text, text)",
  "yike_otp_latest_verifiable(text, text)",
  "yike_otp_ip_send_count_hour(text, text)",
  "yike_otp_ip_verify_attempts_hour(text, text)",
] as const;

test("OTP RPC hardening migration revokes anon/authenticated execute", () => {
  const sql = fs.readFileSync(
    path.resolve(
      process.cwd(),
      "supabase/migrations/20261024160000_harden_phone_otp_rpc_grants.sql",
    ),
    "utf-8",
  );
  for (const sig of OTP_RPC_SIGNATURES) {
    if (sig.includes("yike_otp_ip_") || sig.includes("timestamptz, text)")) continue;
    assert.ok(
      sql.includes(`REVOKE ALL ON FUNCTION public.${sig}`),
      `missing revoke for ${sig}`,
    );
  }
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.yike_otp_verify_success\(text, uuid, text\) TO service_role/);
  assert.match(sql, /verified = FALSE/);
  assert.match(sql, /status = 'sent'/);
});

test("auth phone OTP uses service-role admin client with server token — not anon PostgREST", () => {
  const rpc = fs.readFileSync(
    path.resolve(process.cwd(), "src/lib/otp/rpc.ts"),
    "utf-8",
  );
  const signup = fs.readFileSync(
    path.resolve(process.cwd(), "src/app/api/auth/signup/route.ts"),
    "utf-8",
  );
  assert.match(rpc, /createAdminClient/);
  assert.match(rpc, /YIKE_OTP_SERVER_TOKEN/);
  assert.doesNotMatch(signup, /yike_otp_insert_pending/);
  assert.match(signup, /auth-email-otp|sendAuthEmailOtp|isEmailOtpEnabled/);
});

test("IP rate-limit migration adds phone_otp_requests.ip_hash and service-only RPCs", () => {
  const sql = fs.readFileSync(
    path.resolve(
      process.cwd(),
      "supabase/migrations/20261024161000_otp_ip_rate_limit_foundation.sql",
    ),
    "utf-8",
  );
  assert.match(sql, /phone_otp_requests[\s\S]*ip_hash/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.yike_otp_ip_send_count_hour/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.yike_otp_ip_send_count_hour\(text, text\) TO service_role/);
});
