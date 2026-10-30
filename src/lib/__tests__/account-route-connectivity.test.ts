import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  paymentsHistoryPath,
  resolveWalletBackNavigation,
  walletAuthLoginPath,
  walletPath,
  WALLET_FROM_AGENT,
} from "@/lib/navigation/account-routes";
import { consumerRoute } from "@/lib/navigation/consumer-routes";

const root = process.cwd();

test("walletPath uses canonical consumer wallet route", () => {
  assert.equal(walletPath(), consumerRoute("wallet"));
  assert.equal(walletPath(), "/account/coins");
  assert.equal(walletPath({ from: WALLET_FROM_AGENT }), "/account/coins?from=agent");
});

test("paymentsHistoryPath preserves wallet return context", () => {
  assert.equal(paymentsHistoryPath(), "/payments/history");
  assert.equal(
    paymentsHistoryPath({ from: WALLET_FROM_AGENT }),
    "/payments/history?from=agent",
  );
});

test("payment history page reads from param for wallet back link", () => {
  const page = readFileSync(
    join(root, "src/app/(public)/payments/history/page.tsx"),
    "utf8",
  );
  assert.match(page, /parseWalletFromParam/);
  assert.match(page, /walletPath\(walletFrom/);
});

test("walletAuthLoginPath encodes safe return to wallet", () => {
  const path = walletAuthLoginPath({ from: WALLET_FROM_AGENT });
  assert.match(path, /^\/auth\/login\?next=/);
  assert.ok(path.includes(encodeURIComponent("/account/coins?from=agent")));
});

test("resolveWalletBackNavigation returns agent dashboard when from=agent", () => {
  const nav = resolveWalletBackNavigation({
    from: WALLET_FROM_AGENT,
    profile: { role: "user" },
  });
  assert.equal(nav.href, "/agent");
  assert.match(nav.label, /agent dashboard/i);
});

test("resolveWalletBackNavigation sends listers to profile dashboard by default", () => {
  const nav = resolveWalletBackNavigation({
    from: null,
    profile: { role: "agent" },
  });
  assert.equal(nav.href, "/agent");
});

test("resolveWalletBackNavigation sends plain consumers home", () => {
  const nav = resolveWalletBackNavigation({
    from: null,
    profile: { role: "user" },
  });
  assert.equal(nav.href, "/");
});

test("wallet page binds session user and dynamic back navigation", () => {
  const page = readFileSync(
    join(root, "src/app/(public)/account/coins/page.tsx"),
    "utf8",
  );
  assert.match(page, /getUser\(\)/);
  assert.match(page, /getYikeCoinBalance\(user\.id\)/);
  assert.match(page, /resolveWalletBackNavigation/);
  assert.match(page, /walletAuthLoginPath/);
  assert.match(page, /WalletPageExperience/);
});

test("agent dashboard hero links to wallet with agent return context", () => {
  const hero = readFileSync(
    join(root, "src/components/agent/agent-hero-yc-balance.tsx"),
    "utf8",
  );
  assert.match(hero, /walletPath\(\{ from: WALLET_FROM_AGENT \}\)/);
  assert.match(hero, /\/api\/yike-coins\/balance/);
});

test("balance API derives identity from session only", () => {
  const route = readFileSync(
    join(root, "src/app/api/yike-coins/balance/route.ts"),
    "utf8",
  );
  assert.match(route, /auth\.getUser\(\)/);
  assert.match(route, /getYikeCoinBalance\(user\.id\)/);
  assert.doesNotMatch(route, /searchParams\.get\("userId"\)/);
});

const INTERNAL_ROUTE_CHECKS: { path: string; label: string }[] = [
  { path: "src/app/agent/page.tsx", label: "Agent dashboard" },
  { path: "src/app/(public)/account/coins/page.tsx", label: "Wallet" },
  { path: "src/app/(public)/payments/history/page.tsx", label: "Payment history" },
  { path: "src/app/conversations/page.tsx", label: "Messages inbox" },
  { path: "src/app/(public)/account/delete/page.tsx", label: "Delete account" },
  { path: "src/app/(public)/account/billing/page.tsx", label: "Billing" },
];

test("account-related app routes exist on disk", () => {
  for (const { path, label } of INTERNAL_ROUTE_CHECKS) {
    assert.ok(existsSync(join(root, path)), `${label} missing at ${path}`);
  }
});

test("payment callback links use walletPath helper", () => {
  const src = readFileSync(
    join(root, "src/app/payments/callback/payment-callback-client.tsx"),
    "utf8",
  );
  assert.match(src, /walletPath\(\)/);
  assert.doesNotMatch(src, /href="\/account\/coins"/);
});
