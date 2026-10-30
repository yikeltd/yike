import assert from "node:assert/strict";
import test from "node:test";
import { parseNigerianPhone, toInternationalNigerianPhone } from "@/lib/phone";
import {
  classifySendchampSendFailure,
  mapSendchampFailureToUserError,
} from "@/lib/phone-verification/sendchamp-errors";
import {
  isRealSmsTestEnabled,
  shouldUseSellerSmsDevConsoleFallback,
} from "@/lib/phone-verification/real-sms-test";
import { PHONE_VERIFY_COPY } from "@/lib/phone-verification/copy";

const ENV_KEYS = ["YIKE_REAL_SMS_TEST", "APP_ENV"] as const;

function saveEnv(): Record<string, string | undefined> {
  const saved: Record<string, string | undefined> = {};
  for (const key of ENV_KEYS) saved[key] = process.env[key];
  return saved;
}

function restoreEnv(saved: Record<string, string | undefined>) {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
}

test("real SMS test mode disables dev-console fallback in development", () => {
  const saved = saveEnv();
  try {
    process.env.APP_ENV = "development";
    delete process.env.YIKE_REAL_SMS_TEST;
    assert.equal(shouldUseSellerSmsDevConsoleFallback(), true);

    process.env.YIKE_REAL_SMS_TEST = "true";
    assert.equal(isRealSmsTestEnabled(), true);
    assert.equal(shouldUseSellerSmsDevConsoleFallback(), false);
  } finally {
    restoreEnv(saved);
  }
});

test("production never uses seller SMS dev-console fallback", () => {
  const saved = saveEnv();
  try {
    process.env.APP_ENV = "production";
    delete process.env.YIKE_REAL_SMS_TEST;
    assert.equal(shouldUseSellerSmsDevConsoleFallback(), false);
  } finally {
    restoreEnv(saved);
  }
});

test("provider failure maps to safe category, not terminal-code copy", () => {
  const mapped = mapSendchampFailureToUserError({
    error: "Invalid Access Key",
    status: 407,
    code: "provider_auth_failed",
  });
  assert.equal(mapped.category, "authentication");
  assert.doesNotMatch(mapped.userMessage, /npm run dev/i);
  assert.doesNotMatch(mapped.userMessage, /terminal/i);
});

test("network failures are categorized separately", () => {
  assert.equal(
    classifySendchampSendFailure({ error: "Sendchamp network error", status: 504 }),
    "network"
  );
});

test("local Nigerian input normalizes to 234 before Sendchamp", () => {
  const parsed = parseNigerianPhone("08012345678");
  assert.equal(toInternationalNigerianPhone("08012345678"), "2348012345678");
  assert.equal(parsed?.intl13, "2348012345678");
});

test("placeholder Sendchamp API key does not block a real public key", async () => {
  const saved = saveEnv();
  try {
    process.env.APP_ENV = "development";
    process.env.SENDCHAMP_API_KEY = "your-sendchamp-api-key";
    process.env.SENDCHAMP_PUBLIC_KEY = "sendchamp_live_test_key_value";
    const { resolveSendchampAccessKey } = await import(
      "@/lib/notifications/providers/sendchamp-access-key"
    );
    assert.equal(resolveSendchampAccessKey()?.source, "SENDCHAMP_PUBLIC_KEY");
  } finally {
    restoreEnv(saved);
  }
});

test("dev-console copy is distinct from production sentSms copy", () => {
  assert.match(PHONE_VERIFY_COPY.devConsoleSms, /npm run dev/i);
  assert.match(PHONE_VERIFY_COPY.sentSms, /6-digit code/i);
  assert.doesNotMatch(PHONE_VERIFY_COPY.sentSms, /provider/i);
});
