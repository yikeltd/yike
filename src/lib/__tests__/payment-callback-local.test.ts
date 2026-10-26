import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  mapVerifyHttpToPhase,
  paymentStatusToPhase,
  reconcileHttpIndicatesUnavailable,
  shouldAttemptReconcile,
} from "@/lib/payments/callback-flow";

test("service worker treats payment callback routes as network-required", () => {
  const sw = fs.readFileSync(path.resolve(process.cwd(), "public/sw.js"), "utf-8");
  assert.match(sw, /"\/payments\/"/);
});

test("payment callback client never trusts redirect params alone", () => {
  const src = fs.readFileSync(
    path.resolve(process.cwd(), "src/app/payments/callback/payment-callback-client.tsx"),
    "utf-8",
  );
  assert.match(src, /\/api\/payments\/verify\//);
  assert.match(src, /\/api\/payments\/reconcile/);
  assert.match(src, /server verification/i);
  assert.doesNotMatch(src, /searchParams\.get\("status"\)/);
});

test("callback flow maps verify responses to phases", () => {
  assert.equal(paymentStatusToPhase("pending"), "processing");
  assert.equal(paymentStatusToPhase("successful"), "processing");
  assert.equal(paymentStatusToPhase("failed"), "failed");
  assert.equal(mapVerifyHttpToPhase(503, {}), "verification_unavailable");
  assert.equal(mapVerifyHttpToPhase(404, { ok: false }), "failed");
  assert.equal(mapVerifyHttpToPhase(200, { ok: true, status: "pending" }), "processing");
});

test("reconcile polling cadence and unavailable detection", () => {
  assert.equal(shouldAttemptReconcile(0), false);
  assert.equal(shouldAttemptReconcile(2), true);
  assert.equal(reconcileHttpIndicatesUnavailable(503), true);
  assert.equal(reconcileHttpIndicatesUnavailable(502, "verify_failed"), true);
  assert.equal(reconcileHttpIndicatesUnavailable(202), false);
});

test("getSiteBaseUrl prefers localhost in development when unset", () => {
  const src = fs.readFileSync(
    path.resolve(process.cwd(), "src/lib/payments/config.ts"),
    "utf-8",
  );
  assert.match(src, /localhost/);
  assert.match(src, /NODE_ENV === "development"/);
});

test("local dev guards block live Paystack and production DB by default", () => {
  const src = fs.readFileSync(
    path.resolve(process.cwd(), "src/lib/dev/runtime-safety.ts"),
    "utf-8",
  );
  assert.match(src, /YIKE_ALLOW_PRODUCTION_DB_IN_DEV/);
  assert.match(src, /YIKE_ALLOW_LIVE_PAYSTACK_IN_DEV/);
  assert.match(src, /sk_live_/);

  const init = fs.readFileSync(
    path.resolve(process.cwd(), "src/app/api/payments/initialize/route.ts"),
    "utf-8",
  );
  assert.match(init, /guardLocalPaymentMutation/);
});

test("wallet balance hero refresh uses authoritative balance API", () => {
  const src = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/yike-coins/wallet-balance-hero.tsx"),
    "utf-8",
  );
  assert.match(src, /\/api\/yike-coins\/balance/);
  assert.match(src, /YIKE_COINS_BALANCE_CHANGED_EVENT/);
});

test("reconcile route keeps Paystack verify as fulfilment gate", () => {
  const src = fs.readFileSync(
    path.resolve(process.cwd(), "src/app/api/payments/reconcile/route.ts"),
    "utf-8",
  );
  assert.match(src, /reconcileAndFulfillPayment/);
});

test("ledger history does not drive wallet hero balance", () => {
  const ledger = fs.readFileSync(
    path.resolve(process.cwd(), "src/app/(public)/account/coins/ledger-client.tsx"),
    "utf-8",
  );
  const hero = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/yike-coins/wallet-balance-hero.tsx"),
    "utf-8",
  );
  assert.doesNotMatch(ledger, /setBalance/);
  assert.match(hero, /\/api\/yike-coins\/balance/);
  assert.match(
    fs.readFileSync(
      path.resolve(process.cwd(), "src/app/payments/callback/payment-callback-client.tsx"),
      "utf-8",
    ),
    /dispatchYikeCoinsBalanceChanged/,
  );
});

test("checkout availability surfaces local Paystack and DB guards", () => {
  const src = fs.readFileSync(
    path.resolve(process.cwd(), "src/lib/payments/checkout-availability.ts"),
    "utf-8",
  );
  assert.match(src, /guardLocalPaymentMutation/);
  assert.match(src, /live_paystack_blocked/);
  assert.match(src, /production_db_blocked/);
});

test("dev test credit route blocks production database target", () => {
  const src = fs.readFileSync(
    path.resolve(process.cwd(), "src/app/api/dev/yike-coins/test-credit/route.ts"),
    "utf-8",
  );
  assert.match(src, /guardLocalDatabaseMutation/);
});

test("wallet top-up idempotency key is tied to payment reference", () => {
  const src = fs.readFileSync(
    path.resolve(process.cwd(), "src/lib/payments/fulfillment/wallet-topup.ts"),
    "utf-8",
  );
  assert.match(src, /wallet_topup:\$\{order\.reference\}/);
});
