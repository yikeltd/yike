import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { YIKE_COINS_NON_CASH_NOTICE } from "@/lib/yike-coins/constants";

test("agent dashboard orders Business Snapshot and Recent Activity before Agent Tools", () => {
  const src = readFileSync(
    join(process.cwd(), "src/components/profile/seller-command-center.tsx"),
    "utf8",
  );
  const snapshotIdx = src.indexOf('title="Business Snapshot"');
  const activityIdx = src.indexOf('title="Recent Activity"');
  const toolsIdx = src.indexOf('title="Agent Tools"');
  const conversationsIdx = src.indexOf('title="Recent Conversations"');
  assert.ok(snapshotIdx >= 0 && activityIdx > snapshotIdx && toolsIdx > activityIdx);
  assert.ok(conversationsIdx > toolsIdx, "Recent Conversations follows Agent Tools");
});

test("agent dashboard removes standalone wallet card and status active from hero", () => {
  const src = readFileSync(
    join(process.cwd(), "src/components/profile/seller-command-center.tsx"),
    "utf8",
  );
  assert.doesNotMatch(src, /YikeCoinsWalletCard/);
  assert.doesNotMatch(src, />\s*STATUS\s*</);
  assert.doesNotMatch(src, /animate-pulse shrink-0/);
  assert.match(src, /AgentHeroYcBalance/);
});

test("hero YC balance links to wallet route with agent return context", () => {
  const src = readFileSync(
    join(process.cwd(), "src/components/agent/agent-hero-yc-balance.tsx"),
    "utf8",
  );
  assert.match(src, /walletPath\(\{ from: WALLET_FROM_AGENT \}\)/);
  assert.match(src, /formatYikeCoins/);
});

test("wallet page exposes top-up, send, and history anchors", () => {
  const src = readFileSync(
    join(process.cwd(), "src/components/yike-coins/wallet-page-experience.tsx"),
    "utf8",
  );
  assert.match(src, /id="wallet-top-up"/);
  assert.match(src, /id="wallet-send"/);
  assert.match(src, /id="wallet-history"/);
  assert.match(src, /<YikeCoinsNonCashNotice/);
});

test("non-withdrawable YC notice matches required copy", () => {
  assert.match(YIKE_COINS_NON_CASH_NOTICE, /non-withdrawable platform credits/);
  assert.match(YIKE_COINS_NON_CASH_NOTICE, /cannot be redeemed for cash/);
  assert.match(YIKE_COINS_NON_CASH_NOTICE, /paid out to a bank account/);
});

test("admin adjust route requires super admin and supports username recipient", () => {
  const src = readFileSync(
    join(process.cwd(), "src/app/api/admin/yike-coins/adjust/route.ts"),
    "utf8",
  );
  assert.match(src, /requireSuperAdminApi/);
  assert.match(src, /recipientUsername/);
  assert.match(src, /reason\.length < 3/);
  assert.match(src, /debitYikeCoins/);
  assert.match(src, /executeAdminYcGrant/);
});

test("legacy wallet card omits video call hint and empty activity sentence", () => {
  const src = readFileSync(
    join(process.cwd(), "src/components/agent/yike-coins-wallet-card.tsx"),
    "utf8",
  );
  assert.doesNotMatch(src, /free video call\(s\) left today/);
  assert.doesNotMatch(src, /No recent activity\./);
});
