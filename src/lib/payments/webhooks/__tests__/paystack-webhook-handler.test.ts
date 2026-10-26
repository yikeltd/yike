import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

test("Paystack webhook POST verifies signature before JSON parse and maps failures to 401/503", () => {
  const src = readFileSync(
    join(process.cwd(), "src/lib/payments/webhooks/paystack.ts"),
    "utf8",
  );
  assert.match(src, /const rawBody = await request\.text\(\)/);
  assert.match(src, /verifyWebhookSignature\?\.\(rawBody/);
  assert.match(src, /status: 401/);
  assert.match(src, /invalid_signature/);
  assert.match(src, /Paystack not configured/);
  assert.match(src, /status: 503/);
  assert.match(src, /recordPaystackWebhookEvent/);
  assert.match(src, /reconcileAndFulfillPayment/);
});
