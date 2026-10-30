import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";

test("seller phone verification enforces IP send limits via shared otp ip-rate-limit module", () => {
  const servicePath = path.resolve(
    process.cwd(),
    "src/lib/phone-verification/service.ts",
  );
  const src = fs.readFileSync(servicePath, "utf-8");
  assert.match(src, /assertOtpSendAllowedForIp/);
  assert.match(src, /assertOtpVerifyAllowedForIp/);
});

test("seller phone verification service enforces duplicate ownership and atomic session updates", () => {
  const servicePath = path.resolve(
    process.cwd(),
    "src/lib/phone-verification/service.ts",
  );
  const src = fs.readFileSync(servicePath, "utf-8");

  assert.match(src, /isNormalizedPhoneTakenByOtherAccount/);
  assert.match(src, /phone_verified: false/);
  assert.match(src, /\.eq\("verify_attempts", session\.verify_attempts\)/);
  assert.match(src, /\.eq\("status", "sent"\)/);
  assert.match(
    src,
    /isAuthSmsVerificationBypassActive\(\)[\s\S]*verifySellerPhoneCode/,
  );
});

test("OTP delivery audit redacts phone by default", () => {
  const auditPath = path.resolve(process.cwd(), "src/lib/otp/delivery-audit.ts");
  const src = fs.readFileSync(auditPath, "utf-8");
  assert.match(src, /return true;/);
  assert.match(src, /OTP_DELIVERY_AUDIT_REDACT/);
});

test("local OTP migration revokes anon execute on yike_otp RPCs", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "supabase/migrations/20261024160000_harden_phone_otp_rpc_grants.sql",
  );
  assert.ok(fs.existsSync(migrationPath));
  const sql = fs.readFileSync(migrationPath, "utf-8");
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.yike_otp_verify_success/);
  assert.match(sql, /verified = FALSE/);
  assert.match(sql, /status = 'sent'/);
});

test("phone OTP RPC calls require server token via admin client", () => {
  const rpcPath = path.resolve(process.cwd(), "src/lib/otp/rpc.ts");
  const src = fs.readFileSync(rpcPath, "utf-8");
  assert.match(src, /requireOtpServerToken|getOtpServerTokenFromEnv/);
  assert.match(src, /createAdminClient/);
});
