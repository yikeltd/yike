import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isDevYikeCoinTestCreditEnabled } from "@/lib/yike-coins/dev-test-credit";

test("resolveListingSeller uses unified properties table", () => {
  const src = readFileSync(
    join(process.cwd(), "src/lib/marketplace-messaging/service.ts"),
    "utf8",
  );
  assert.match(src, /\.from\("properties"\)/);
  assert.doesNotMatch(src, /\.from\("vehicles"\)/);
});

test("conversation detail route serves marketplace metadata", () => {
  const src = readFileSync(
    join(process.cwd(), "src/app/api/conversations/[id]/route.ts"),
    "utf8",
  );
  assert.match(src, /getMarketplaceConversationForUser/);
  assert.doesNotMatch(src, /status: 410/);
});

test("dev coin test credit is disabled in production posture", () => {
  const prevApp = process.env.APP_ENV;
  const prevFlag = process.env.YIKE_DEV_COIN_TEST_CREDIT;
  process.env.APP_ENV = "production";
  process.env.YIKE_DEV_COIN_TEST_CREDIT = "true";
  assert.equal(isDevYikeCoinTestCreditEnabled(), false);
  process.env.APP_ENV = prevApp;
  process.env.YIKE_DEV_COIN_TEST_CREDIT = prevFlag;
});

test("dev test credit route is production gated", () => {
  const src = readFileSync(
    join(process.cwd(), "src/app/api/dev/yike-coins/test-credit/route.ts"),
    "utf8",
  );
  assert.match(src, /isProductionEnv/);
  assert.match(src, /isDevYikeCoinTestCreditEnabled/);
  assert.match(src, /dev_test_credit:/);
});

test("agent dashboard renders Yike Coins wallet card", () => {
  const src = readFileSync(
    join(process.cwd(), "src/components/profile/seller-command-center.tsx"),
    "utf8",
  );
  assert.match(src, /YikeCoinsWalletCard/);
  const wallet = readFileSync(
    join(process.cwd(), "src/components/agent/yike-coins-wallet-card.tsx"),
    "utf8",
  );
  assert.match(wallet, /\/api\/yike-coins\/balance/);
});
