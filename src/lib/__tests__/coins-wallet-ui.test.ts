import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  YIKE_COIN_ABBR,
  formatYc,
  normalizeYcText,
} from "@/lib/yike-coins/constants";
import { getWalletTopupCheckoutStatus } from "@/lib/payments/checkout-availability";

test("YC abbreviation renders as plain text", () => {
  assert.equal(YIKE_COIN_ABBR, "YC");
  assert.equal(formatYc(500), "500 YC");
  assert.equal(normalizeYcText("Sent Y&#x43; to @ada"), "Sent YC to @ada");
  assert.equal(normalizeYcText("500 Y&#67;"), "500 YC");
});

test("wallet page lives under public ConsumerShell layout", () => {
  const page = readFileSync(
    join(process.cwd(), "src/app/(public)/account/coins/page.tsx"),
    "utf8",
  );
  assert.match(page, /ConsumerSubpageHeader/);
  assert.match(page, /resolveWalletBackNavigation/);
  assert.doesNotMatch(page, /<main/);
});

test("wallet page uses unified username section", () => {
  const page = readFileSync(
    join(process.cwd(), "src/app/(public)/account/coins/page.tsx"),
    "utf8",
  );
  assert.match(page, /WalletUsernameSection/);
  assert.doesNotMatch(page, /UsernameClaimClient/);
  const section = readFileSync(
    join(process.cwd(), "src/app/(public)/account/coins/wallet-username-section.tsx"),
    "utf8",
  );
  assert.match(section, /htmlFor="wallet-username"/);
  assert.match(section, /Change username/);
  assert.doesNotMatch(section, /You already have a username/);
});

test("packages API exposes checkout availability for wallet UI", () => {
  const route = readFileSync(
    join(process.cwd(), "src/app/api/yike-coins/packages/route.ts"),
    "utf8",
  );
  assert.match(route, /getWalletTopupCheckoutStatus/);
  assert.match(route, /checkoutAvailable/);
  const topup = readFileSync(
    join(process.cwd(), "src/app/(public)/account/coins/topup-client.tsx"),
    "utf8",
  );
  assert.match(topup, /checkoutAvailable/);
  assert.match(topup, /checkoutMessage/);
  assert.match(topup, /YcAmount/);
});

test("top-up checkout status requires Paystack secret and payments runtime flag", () => {
  const prevSecret = process.env.PAYSTACK_SECRET_KEY;
  const prevPay = process.env.ENABLE_PAYMENTS;
  delete process.env.PAYSTACK_SECRET_KEY;
  delete process.env.ENABLE_PAYMENTS;
  delete process.env.ENABLE_FEATURED_PAYMENTS;
  try {
    const off = getWalletTopupCheckoutStatus();
    assert.equal(off.available, false);
    assert.equal(off.reasonCode, "paystack_unconfigured");
  } finally {
    if (prevSecret === undefined) delete process.env.PAYSTACK_SECRET_KEY;
    else process.env.PAYSTACK_SECRET_KEY = prevSecret;
    if (prevPay === undefined) delete process.env.ENABLE_PAYMENTS;
    else process.env.ENABLE_PAYMENTS = prevPay;
  }
});
