import assert from "node:assert/strict";
import test from "node:test";
import {
  ipSendLimitExceeded,
  ipVerifyLimitExceeded,
  OTP_MAX_SENDS_PER_IP_HOUR,
  OTP_MAX_VERIFY_ATTEMPTS_PER_IP_HOUR,
} from "@/lib/otp/ip-rate-limit";
import { clientIpFromRequest } from "@/lib/http/trusted-client-ip";

test("IP send and verify budgets use documented thresholds", () => {
  assert.equal(ipSendLimitExceeded(OTP_MAX_SENDS_PER_IP_HOUR - 1), false);
  assert.equal(ipSendLimitExceeded(OTP_MAX_SENDS_PER_IP_HOUR), true);
  assert.equal(ipVerifyLimitExceeded(OTP_MAX_VERIFY_ATTEMPTS_PER_IP_HOUR - 1), false);
  assert.equal(ipVerifyLimitExceeded(OTP_MAX_VERIFY_ATTEMPTS_PER_IP_HOUR), true);
});

test("trusted proxy headers are ignored when YIKE_TRUST_PROXY_HEADERS=false", () => {
  const prev = process.env.YIKE_TRUST_PROXY_HEADERS;
  process.env.YIKE_TRUST_PROXY_HEADERS = "false";
  try {
    const req = new Request("https://yike.ng/api/test", {
      headers: { "x-forwarded-for": "203.0.113.10" },
    });
    assert.equal(clientIpFromRequest(req), null);
  } finally {
    if (prev === undefined) delete process.env.YIKE_TRUST_PROXY_HEADERS;
    else process.env.YIKE_TRUST_PROXY_HEADERS = prev;
  }
});

test("first x-forwarded-for hop is used when proxy trust is enabled", () => {
  const prev = process.env.YIKE_TRUST_PROXY_HEADERS;
  process.env.YIKE_TRUST_PROXY_HEADERS = "true";
  try {
    const req = new Request("https://yike.ng/api/test", {
      headers: { "x-forwarded-for": "203.0.113.10, 10.0.0.1" },
    });
    assert.equal(clientIpFromRequest(req), "203.0.113.10");
  } finally {
    if (prev === undefined) delete process.env.YIKE_TRUST_PROXY_HEADERS;
    else process.env.YIKE_TRUST_PROXY_HEADERS = prev;
  }
});
