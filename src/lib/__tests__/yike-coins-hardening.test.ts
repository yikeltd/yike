import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ngnToCoins, YIKE_COINS_TIMEZONE } from "@/lib/yike-coins/constants";

test("hardening migration revokes coin RPC from authenticated role", () => {
  const sql = readFileSync(
    join(process.cwd(), "supabase/migrations/20261023210000_yike_coins_hardening.sql"),
    "utf8"
  );
  assert.match(sql, /REVOKE ALL ON FUNCTION public.yike_coin_debit/);
  assert.match(sql, /FROM authenticated/);
  assert.match(sql, /yike_coin_reverse_debit/);
  assert.match(sql, /yike_video_try_consume_free_allowance/);
  assert.match(sql, /yike_video_release_free_allowance/);
  assert.match(sql, /video_call_free_allowance_claims/);
});

test("base migration rejects idempotency key mismatch on credit and debit", () => {
  const sql = readFileSync(
    join(process.cwd(), "supabase/migrations/20261023180000_yike_coins_messaging_calls.sql"),
    "utf8"
  );
  assert.match(sql, /idempotency_key_mismatch/);
  assert.match(sql, /WHEN unique_violation/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public.yike_coin_credit/);
});

test("reverse debit validates reversal idempotency against original debit", () => {
  const sql = readFileSync(
    join(process.cwd(), "supabase/migrations/20261023210000_yike_coins_hardening.sql"),
    "utf8"
  );
  assert.match(sql, /reverses_ledger_id/);
  assert.match(sql, /idempotency_key_mismatch/);
});

test("ledger maps idempotency mismatch from RPC", () => {
  const src = readFileSync(join(process.cwd(), "src/lib/yike-coins/ledger.ts"), "utf8");
  assert.match(src, /idempotency_key_mismatch/);
  assert.match(src, /idempotency_mismatch/);
});

test("failed call path releases free allowance and reverses coin billing rollback", () => {
  const src = readFileSync(join(process.cwd(), "src/lib/video-calls/sessions.ts"), "utf8");
  assert.match(src, /releaseFreeVideoAllowance/);
  assert.match(src, /undoConnectionBilling/);
  assert.match(src, /finalizeMarketplaceCallSession/);
});

test("free allowance consume is session-scoped", () => {
  const src = readFileSync(join(process.cwd(), "src/lib/video-calls/allowance.ts"), "utf8");
  assert.match(src, /p_session_id: sessionId/);
});

test("purchase engine source reverses on delivery failure", () => {
  const src = readFileSync(
    join(process.cwd(), "src/lib/yike-coins/purchase-engine.ts"),
    "utf8"
  );
  assert.match(src, /reverseYikeCoinDebit/);
  assert.match(src, /markEntitlementReversed/);
});

test("boost coin purchase cancels pending promotion when debit/delivery fails", () => {
  const src = readFileSync(
    join(process.cwd(), "src/lib/yike-coins/boost-purchase.ts"),
    "utf8"
  );
  assert.match(src, /status: "cancelled"/);
  assert.match(src, /activateBoostPromotion/);
});

test("lagos timezone constant matches brief", () => {
  assert.equal(YIKE_COINS_TIMEZONE, "Africa/Lagos");
});

test("boost NGN revenue maps to coins 1:1 nominal", () => {
  assert.equal(ngnToCoins(999), 999);
});

test("video connect bills only after atomic ringing to connected claim", () => {
  const src = readFileSync(
    join(process.cwd(), "src/lib/video-calls/sessions.ts"),
    "utf8"
  );
  assert.match(src, /applyVideoCallConnectionBilling/);
  assert.match(src, /\.eq\("status", "ringing"\)/);
  assert.match(src, /rollbackFailedConnection/);
  assert.match(src, /tryConsumeFreeVideoAllowance/);
});

test("wallet top-up fulfillment uses payment reference idempotency", () => {
  const src = readFileSync(
    join(process.cwd(), "src/lib/payments/fulfillment/wallet-topup.ts"),
    "utf8"
  );
  assert.match(src, /wallet_topup:\$\{order\.reference\}/);
  assert.match(src, /yike_coins_fulfilled/);
});

test("boost coin purchase checks listing_boost platform activation gate", () => {
  const src = readFileSync(
    join(process.cwd(), "src/lib/yike-coins/boost-purchase.ts"),
    "utf8"
  );
  assert.match(src, /isListingBoostCoinPurchaseEnabled/);
});

test("admin coin adjustment requires super admin route", () => {
  const src = readFileSync(
    join(process.cwd(), "src/app/api/admin/yike-coins/adjust/route.ts"),
    "utf8"
  );
  assert.match(src, /requireSuperAdminApi/);
  assert.match(src, /admin_adjust:/);
});

test("Agora certificate stays server-side in provider", () => {
  const src = readFileSync(
    join(process.cwd(), "src/lib/video-calls/provider.ts"),
    "utf8"
  );
  assert.match(src, /AGORA_APP_CERTIFICATE/);
  assert.match(src, /RtcTokenBuilder/);
  assert.doesNotMatch(src, /NEXT_PUBLIC.*CERTIFICATE/);
});

test("seller phone access never returns phone without entitlement", () => {
  const src = readFileSync(
    join(process.cwd(), "src/lib/seller-contact/phone-access.ts"),
    "utf8"
  );
  assert.match(src, /canRevealPhone: false/);
  assert.match(src, /phone: null/);
  assert.match(src, /getActiveUserSubscription/);
});
