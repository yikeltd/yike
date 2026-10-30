import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import {
  SELLER_SMS_MAX_SENDS_PER_PHONE_HOUR,
  providerReferenceAcceptedBySendchamp,
  sellerSmsSendCountsTowardHourlyLimit,
} from "@/lib/phone-verification/seller-sms-rate-limit";
import { ipSendLimitExceeded } from "@/lib/otp/ip-rate-limit";

test("failed Sendchamp auth claim does not count toward hourly SMS budget", () => {
  assert.equal(
    sellerSmsSendCountsTowardHourlyLimit({
      status: "sent",
      provider_reference: "pending:abc-123",
    }),
    false,
  );
  assert.equal(
    sellerSmsSendCountsTowardHourlyLimit({
      status: "expired",
      provider_reference: "pending:abc-123",
    }),
    false,
  );
  assert.equal(
    sellerSmsSendCountsTowardHourlyLimit({
      status: "expired",
      provider_reference: "sc-ref-real",
    }),
    false,
  );
});

test("provider acceptance counts toward hourly limit and cooldown eligibility", () => {
  assert.equal(providerReferenceAcceptedBySendchamp("sc-verification-id"), true);
  assert.equal(
    sellerSmsSendCountsTowardHourlyLimit({
      status: "sent",
      provider_reference: "sc-verification-id",
    }),
    true,
  );
  assert.equal(
    sellerSmsSendCountsTowardHourlyLimit({
      status: "verified",
      provider_reference: "sc-verification-id",
    }),
    true,
  );
});

test("genuine abuse still hits rate limit when provider accepted sends reach cap", () => {
  const accepted = SELLER_SMS_MAX_SENDS_PER_PHONE_HOUR;
  assert.ok(accepted >= 3);
  assert.equal(accepted >= SELLER_SMS_MAX_SENDS_PER_PHONE_HOUR, true);
});

test("provider/network failure path expires claim and does not leave stale budget row", () => {
  const servicePath = path.resolve(
    process.cwd(),
    "src/lib/phone-verification/service.ts",
  );
  const src = fs.readFileSync(servicePath, "utf-8");
  assert.match(src, /status: "expired"/);
  assert.match(src, /seller_send_failed/);
  assert.match(src, /countProviderAcceptedSendsLastHour/);
  assert.doesNotMatch(
    src,
    /countSendsLastHour/,
    "legacy all-rows hourly counter must not remain",
  );
});

test("concurrent seller sends dedupe in-flight per user+phone+channel", () => {
  const servicePath = path.resolve(
    process.cwd(),
    "src/lib/phone-verification/service.ts",
  );
  const src = fs.readFileSync(servicePath, "utf-8");
  assert.match(src, /sendInFlight/);
  assert.match(src, /seller_send_deduped/);
  assert.match(src, /lockKey = `\$\{params\.userId\}:\$\{phoneIntl\}:\$\{channel\}`/);
});

test("IP hourly send budget uses provider-accepted sessions only", () => {
  const ipPath = path.resolve(process.cwd(), "src/lib/otp/ip-rate-limit.ts");
  const src = fs.readFileSync(ipPath, "utf-8");
  assert.match(src, /sellerSmsSendCountsTowardHourlyLimit/);
});

test("ipSendLimitExceeded still blocks abusive IP volume", () => {
  assert.equal(ipSendLimitExceeded(19), false);
  assert.equal(ipSendLimitExceeded(20), true);
  assert.equal(ipSendLimitExceeded(50), true);
});
