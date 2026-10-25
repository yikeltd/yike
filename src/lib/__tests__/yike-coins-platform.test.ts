import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getYikeCoinTopupPackages } from "@/lib/yike-coins/topup-packages";

test("top-up packages are server-resolved with stable coin mapping", () => {
  const packs = getYikeCoinTopupPackages();
  assert.ok(packs.length >= 1);
  for (const p of packs) {
    assert.equal(p.coins, p.amountNgn);
    assert.equal(p.currency, "NGN");
  }
});

test("payments reconcile route verifies before fulfilment", () => {
  const src = readFileSync(
    join(process.cwd(), "src/app/api/payments/reconcile/route.ts"),
    "utf8",
  );
  assert.match(src, /reconcileAndFulfillPayment/);
  assert.match(src, /order.user_id !== user.id/);
  assert.doesNotMatch(src, /creditYikeCoins/);
});

test("wallet top-up fulfillment uses payment reference idempotency", () => {
  const src = readFileSync(
    join(process.cwd(), "src/lib/payments/fulfillment/wallet-topup.ts"),
    "utf8",
  );
  assert.match(src, /wallet_topup:\$\{order.reference\}/);
  assert.match(src, /yike_coins_fulfilled/);
});

test("message send supports client dedupe id", () => {
  const src = readFileSync(
    join(process.cwd(), "src/lib/marketplace-messaging/service.ts"),
    "utf8",
  );
  assert.match(src, /client_message_id/);
  assert.match(src, /clientMessageId/);
});

test("platform wallet page is not agent-scoped", () => {
  const src = readFileSync(join(process.cwd(), "src/app/account/coins/page.tsx"), "utf8");
  assert.doesNotMatch(src, /canListProperties/);
  assert.match(src, /getYikeCoinBalance/);
});

test("balance and ledger APIs require session not agent role", () => {
  for (const file of [
    "src/app/api/yike-coins/balance/route.ts",
    "src/app/api/yike-coins/ledger/route.ts",
  ]) {
    const src = readFileSync(join(process.cwd(), file), "utf8");
    assert.match(src, /getUser\(\)/);
    assert.doesNotMatch(src, /canListProperties/);
    assert.doesNotMatch(src, /isAgentRole/);
  }
});

test("Paystack initialize route ignores client amount", () => {
  const src = readFileSync(
    join(process.cwd(), "src/app/api/payments/initialize/route.ts"),
    "utf8",
  );
  assert.match(src, /delete body\.amount/);
  assert.match(src, /resolvePayableProduct/);
});

test("ledger API returns authoritative balance with entries", () => {
  const src = readFileSync(
    join(process.cwd(), "src/app/api/yike-coins/ledger/route.ts"),
    "utf8",
  );
  assert.match(src, /getYikeCoinBalance/);
  assert.match(src, /balanceCoins/);
});

test("payments initialize rejects unknown wallet top-up packs in catalog", () => {
  const src = readFileSync(join(process.cwd(), "src/lib/payments/catalog.ts"), "utf8");
  assert.match(src, /Choose a top-up amount/);
  assert.match(src, /packageId/);
});
