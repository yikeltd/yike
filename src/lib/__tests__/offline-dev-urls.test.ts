import assert from "node:assert/strict";
import test from "node:test";
import { resolveAppAbsoluteUrlForRuntime } from "@/lib/payments/config";

test("local dev rewrites production callback URLs to the local origin", () => {
  assert.equal(
    resolveAppAbsoluteUrlForRuntime(
      "http://localhost:3000",
      "https://yike.ng/payments/callback",
      "/payments/callback",
      true,
    ),
    "http://localhost:3000/payments/callback",
  );
  assert.equal(
    resolveAppAbsoluteUrlForRuntime(
      "http://localhost:3000",
      "https://www.yike.ng/api/webhooks/paystack",
      "/api/webhooks/paystack",
      true,
    ),
    "http://localhost:3000/api/webhooks/paystack",
  );
});

test("production runtime keeps configured absolute URLs", () => {
  assert.equal(
    resolveAppAbsoluteUrlForRuntime(
      "https://yike.ng",
      "https://yike.ng/payments/callback",
      "/payments/callback",
      false,
    ),
    "https://yike.ng/payments/callback",
  );
});
