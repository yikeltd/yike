import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

test("wallet page uses integrated experience shell", () => {
  const page = readFileSync(
    join(root, "src/app/(public)/account/coins/page.tsx"),
    "utf8",
  );
  assert.match(page, /WalletPageExperience/);
  assert.match(page, /resolveWalletBackNavigation/);
  assert.doesNotMatch(page, /ConsumerSubpageHeader/);
  assert.doesNotMatch(page, /YikeCoinsNonCashNotice/);
});

test("wallet experience shows single non-cash disclaimer", () => {
  const exp = readFileSync(
    join(root, "src/components/yike-coins/wallet-page-experience.tsx"),
    "utf8",
  );
  const matches = exp.match(/<YikeCoinsNonCashNotice/g);
  assert.equal(matches?.length ?? 0, 1);
  assert.match(exp, /data-testid="yike-coins-wallet-page"/);
  assert.match(exp, /WalletBalanceHero/);
  assert.match(exp, /wallet-top-up/);
  assert.match(exp, /wallet-send/);
  assert.match(exp, /wallet-history/);
});

test("top-up UI hides env override copy and uses pack selection", () => {
  const topup = readFileSync(
    join(root, "src/app/(public)/account/coins/topup-client.tsx"),
    "utf8",
  );
  assert.doesNotMatch(topup, /YikeCoinsNonCashNotice/);
  assert.doesNotMatch(topup, /YIKE_COIN_TOPUP_PACKS_NGN/);
  assert.match(topup, /aria-pressed=\{selected\}/);
  assert.match(topup, /Paystack verifies payment/);
});

test("send YC dispatches balance refresh on success", () => {
  const send = readFileSync(
    join(root, "src/app/(public)/account/coins/send-yc-client.tsx"),
    "utf8",
  );
  assert.match(send, /dispatchYikeCoinsBalanceChanged/);
  assert.match(send, /Insufficient balance/);
});

test("balance hero uses authoritative API with refresh feedback", () => {
  const hero = readFileSync(
    join(root, "src/components/yike-coins/wallet-balance-hero.tsx"),
    "utf8",
  );
  assert.match(hero, /\/api\/yike-coins\/balance/);
  assert.match(hero, /refreshError/);
  assert.match(hero, /YIKE_COINS_BALANCE_CHANGED_EVENT/);
});

test("ledger client has loading, error, and empty states", () => {
  const ledger = readFileSync(
    join(root, "src/app/(public)/account/coins/ledger-client.tsx"),
    "utf8",
  );
  assert.match(ledger, /aria-busy/);
  assert.match(ledger, /Try again/);
  assert.match(ledger, /No wallet activity yet/);
  assert.match(ledger, /ArrowDownLeft/);
});

test("packages API does not expose developer pricing override note", () => {
  const route = readFileSync(
    join(root, "src/app/api/yike-coins/packages/route.ts"),
    "utf8",
  );
  assert.doesNotMatch(route, /pricingNote/);
  assert.doesNotMatch(route, /YIKE_COIN_TOPUP_PACKS_NGN/);
});
