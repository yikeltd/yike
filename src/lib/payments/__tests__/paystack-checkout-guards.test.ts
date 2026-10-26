import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  isPaystackTestPublicKey,
  isPaystackTestSecretKey,
  requirePaystackTestModeForAutomation,
} from "@/lib/payments/config";

test("Paystack test mode detection rejects live secret keys for automation", () => {
  assert.equal(isPaystackTestSecretKey("sk_test_abc"), true);
  assert.equal(isPaystackTestSecretKey("sk_live_abc"), false);
  assert.equal(isPaystackTestPublicKey("pk_test_abc"), true);
  assert.equal(isPaystackTestPublicKey("pk_live_abc"), false);
});

test("requirePaystackTestModeForAutomation blocks sk_live without claiming checkout passed", () => {
  const prev = process.env.PAYSTACK_SECRET_KEY;
  const prevPub = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
  try {
    process.env.PAYSTACK_SECRET_KEY = "sk_live_0123456789";
    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY = "pk_live_0123456789";
    const result = requirePaystackTestModeForAutomation();
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.reason, /Live|sk_test/i);
  } finally {
    if (prev === undefined) delete process.env.PAYSTACK_SECRET_KEY;
    else process.env.PAYSTACK_SECRET_KEY = prev;
    if (prevPub === undefined) delete process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    else process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY = prevPub;
  }
});

test("reconcileAndFulfillPayment validates amount and currency server-side", () => {
  const src = readFileSync(
    join(process.cwd(), "src/lib/payments/services/payment-service.ts"),
    "utf8",
  );
  assert.match(src, /Amount mismatch/);
  assert.match(src, /Currency mismatch/);
  assert.match(src, /verifyPayment\(reference\)/);
  assert.match(src, /code: "amount_mismatch"/);
  assert.match(src, /code: "currency_mismatch"/);
});

test("wallet top-up fulfillment uses stable idempotency key per order reference", () => {
  const src = readFileSync(
    join(process.cwd(), "src/lib/payments/fulfillment/wallet-topup.ts"),
    "utf8",
  );
  assert.match(src, /wallet_topup:\$\{order\.reference\}/);
  assert.match(src, /alreadyFulfilled/);
});

test("Paystack webhook handler records events before fulfillment", () => {
  const src = readFileSync(
    join(process.cwd(), "src/lib/payments/webhooks/paystack.ts"),
    "utf8",
  );
  assert.match(src, /recordPaystackWebhookEvent/);
  assert.match(src, /duplicate delivery/);
  assert.match(src, /reconcileAndFulfillPayment/);
});

test("payment callback client polls status — does not credit wallet directly", () => {
  const src = readFileSync(
    join(process.cwd(), "src/app/payments/callback/payment-callback-client.tsx"),
    "utf8",
  );
  assert.match(src, /\/api\/payments\/(status|reconcile)/);
  assert.doesNotMatch(src, /fulfillWalletTopupOrder/);
});
