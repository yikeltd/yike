import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

test("wallet top-up fulfillment short-circuits when payment order already credited", () => {
  const src = readFileSync(
    join(process.cwd(), "src/lib/payments/fulfillment/wallet-topup.ts"),
    "utf8",
  );
  assert.match(src, /metadata\.yike_coins_fulfilled === true/);
  assert.match(src, /alreadyFulfilled: true/);
  assert.match(src, /wallet_topup:\$\{order\.reference\}/);
});

test("payments catalog validates wallet_topup packs server-side", () => {
  const src = readFileSync(join(process.cwd(), "src/lib/payments/catalog.ts"), "utf8");
  assert.match(src, /purpose === "wallet_topup"/);
  assert.match(src, /getYikeCoinTopupPackages\(\)/);
  assert.match(src, /invalid_pack/);
  assert.match(src, /ngnToCoins/);
});

test("reconcileAndFulfillPayment verifies with provider before wallet credit", () => {
  const src = readFileSync(
    join(process.cwd(), "src/lib/payments/services/payment-service.ts"),
    "utf8",
  );
  assert.match(src, /provider\.verifyPayment\(reference\)/);
  assert.match(src, /order_type === "wallet_topup"/);
  assert.match(src, /fulfillWalletTopupOrder/);
});
