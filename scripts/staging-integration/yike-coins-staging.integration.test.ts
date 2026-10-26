/**
 * Database-backed Yike Coins / video allowance tests — linked dev Supabase only.
 *
 * Run:
 *   set -a && source .env.local && set +a
 *   YIKE_DEV_DB_INTEGRATION=1 npm run verify:dev-target
 *   YIKE_DEV_DB_INTEGRATION=1 npm run test:dev:integration
 *
 * Skips when YIKE_DEV_DB_INTEGRATION is not set or env ref mismatches.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const CANONICAL_DEV_REF = "hlpojfurfldvcxfxhveg";

function supabaseRefFromEnv(): string | null {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const match = url.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i);
  return match?.[1]?.toLowerCase() ?? null;
}

const envRef = supabaseRefFromEnv();
const integrationEnabled =
  process.env.YIKE_DEV_DB_INTEGRATION === "1" &&
  envRef === CANONICAL_DEV_REF &&
  Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());

function adminClient(): SupabaseClient | null {
  if (!integrationEnabled) return null;
  return createClient(
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

function anonClient(): SupabaseClient | null {
  if (!integrationEnabled || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

async function resolveTestUserId(admin: SupabaseClient): Promise<{ userId: string; ephemeral: boolean }> {
  const stable = process.env.YIKE_DEV_TEST_USER_ID?.trim();
  if (stable) return { userId: stable, ephemeral: false };

  const id = randomUUID();
  const email = `dev-integration+${id}@yike.dev.invalid`;
  const { data, error } = await admin.auth.admin.createUser({
    id,
    email,
    email_confirm: true,
  });
  if (error || !data.user?.id) {
    throw new Error(error?.message ?? "Could not create ephemeral test user");
  }
  return { userId: data.user.id, ephemeral: true };
}

async function setTestUsername(admin: SupabaseClient, userId: string, username: string) {
  const { error: rpcError } = await admin.rpc("yike_profile_set_username", {
    p_user_id: userId,
    p_username: username,
    p_allow_change: true,
  });
  if (!rpcError?.message?.includes("Could not find the function")) {
    if (rpcError) throw new Error(rpcError.message);
    return;
  }
  const { error } = await admin.from("profiles").update({ username }).eq("id", userId);
  if (error) throw new Error(error.message);
}

async function ycTransferRpcReady(admin: SupabaseClient): Promise<boolean> {
  const { error } = await admin.rpc("yike_coin_peer_transfer", {
    p_sender_id: "00000000-0000-0000-0000-000000000001",
    p_recipient_username: "missing_user_xyz",
    p_amount_coins: 1,
    p_idempotency_key: "dev-integration:probe",
  });
  if (error?.message?.includes("Could not find the function")) return false;
  return true;
}

async function ycAdminGrantRpcReady(admin: SupabaseClient): Promise<boolean> {
  const { error } = await admin.rpc("yike_coin_admin_grant", {
    p_actor_id: "00000000-0000-0000-0000-000000000001",
    p_recipient_id: "00000000-0000-0000-0000-000000000002",
    p_amount_coins: 1,
    p_reason: "probe",
    p_idempotency_key: "dev-integration:grant-probe",
    p_grant_reference: "PROBE",
  });
  if (error?.message?.includes("Could not find the function")) return false;
  return true;
}

async function cleanupDevIntegrationData(admin: SupabaseClient, userId: string) {
  const { data: sessions } = await admin
    .from("video_call_sessions")
    .select("id")
    .or(`caller_id.eq.${userId},callee_id.eq.${userId}`);
  const sessionIds = (sessions ?? []).map((r) => r.id as string);
  if (sessionIds.length > 0) {
    await admin.from("video_call_free_allowance_claims").delete().in("session_id", sessionIds);
    await admin.from("video_call_sessions").delete().in("id", sessionIds);
  }
  await admin.from("video_call_daily_usage").delete().eq("user_id", userId);
  await admin.from("yike_coin_transfers").delete().or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
  await admin
    .from("yike_coin_admin_grants")
    .delete()
    .or(`recipient_id.eq.${userId},actor_id.eq.${userId}`);
  await admin
    .from("yike_coin_purchase_entitlements")
    .delete()
    .eq("user_id", userId)
    .like("idempotency_key", "dev-integration:%");
  await admin
    .from("yike_coin_ledger")
    .delete()
    .eq("user_id", userId)
    .like("idempotency_key", "dev-integration:%");
  await admin.from("yike_coin_accounts").delete().eq("user_id", userId);
}

async function deleteEphemeralUser(admin: SupabaseClient, userId: string) {
  await cleanupDevIntegrationData(admin, userId);
  await admin.auth.admin.deleteUser(userId);
}

/** Write tests must not use real customer profiles — ephemeral users only. */
async function resolveEphemeralTestUserId(admin: SupabaseClient): Promise<string> {
  if (process.env.YIKE_DEV_TEST_USER_ID?.trim()) {
    throw new Error("Unset YIKE_DEV_TEST_USER_ID for mutating integration tests");
  }
  const { userId } = await resolveTestUserId(admin);
  return userId;
}

test("dev integration prerequisites", { skip: integrationEnabled ? false : "YIKE_DEV_DB_INTEGRATION=1 + .env.local" }, () => {
  assert.equal(envRef, CANONICAL_DEV_REF);
});

test(
  "communications schema tables exist",
  { skip: integrationEnabled ? false : "dev integration not enabled" },
  async () => {
    const admin = adminClient()!;
    const probes: { table: string; select: string }[] = [
      { table: "yike_coin_accounts", select: "user_id" },
      { table: "yike_coin_ledger", select: "id" },
      { table: "yike_coin_purchase_entitlements", select: "id" },
      { table: "marketplace_conversations", select: "id" },
      { table: "video_call_daily_usage", select: "user_id, usage_date" },
    ];
    for (const { table, select } of probes) {
      const { error } = await admin.from(table).select(select).limit(1);
      assert.ok(!error, `${table}: ${error?.message ?? "ok"}`);
    }
  }
);

test(
  "duplicate credit idempotency returns already_applied",
  { skip: integrationEnabled ? false : "dev integration not enabled" },
  async () => {
    const admin = adminClient()!;
    const userId = await resolveEphemeralTestUserId(admin);
    try {
      const idempotencyKey = `dev-integration:credit:${randomUUID()}`;
      const reference = `DEV-CR-${randomUUID().slice(0, 8)}`;

      await admin.rpc("yike_ensure_coin_account", { p_user_id: userId });

      const first = await admin.rpc("yike_coin_credit", {
        p_user_id: userId,
        p_amount_coins: 10,
        p_reference: reference,
        p_idempotency_key: idempotencyKey,
        p_service_code: "wallet_topup",
        p_payment_order_id: null,
        p_reason: "dev integration test",
        p_metadata: { test: true },
      });
      assert.ok(!first.error, first.error?.message);

      const second = await admin.rpc("yike_coin_credit", {
        p_user_id: userId,
        p_amount_coins: 10,
        p_reference: reference,
        p_idempotency_key: idempotencyKey,
        p_service_code: "wallet_topup",
        p_payment_order_id: null,
        p_reason: "dev integration test replay",
        p_metadata: { test: true },
      });
      assert.ok(!second.error, second.error?.message);
      const row = Array.isArray(second.data) ? second.data[0] : second.data;
      assert.equal(Boolean(row?.already_applied), true);
    } finally {
      await deleteEphemeralUser(admin, userId);
    }
  }
);

test(
  "concurrent debits cannot drive balance negative",
  { skip: integrationEnabled ? false : "dev integration not enabled" },
  async () => {
    const admin = adminClient()!;
    const userId = await resolveEphemeralTestUserId(admin);
    try {
      await admin.rpc("yike_ensure_coin_account", { p_user_id: userId });

      const fundKey = `dev-integration:fund:${randomUUID()}`;
      await admin.rpc("yike_coin_credit", {
        p_user_id: userId,
        p_amount_coins: 5,
        p_reference: `DEV-FUND-${randomUUID().slice(0, 8)}`,
        p_idempotency_key: fundKey,
        p_service_code: "wallet_topup",
        p_payment_order_id: null,
        p_reason: "dev fund",
        p_metadata: {},
      });

      const debit = (suffix: string) =>
        admin.rpc("yike_coin_debit", {
          p_user_id: userId,
          p_amount_coins: 5,
          p_reference: `DEV-DB-${suffix}`,
          p_idempotency_key: `dev-integration:debit:${suffix}:${randomUUID()}`,
          p_service_code: "video_call_connected",
          p_reason: "dev concurrent debit",
          p_metadata: {},
        });

      const [a, b] = await Promise.all([debit("a"), debit("b")]);
      const outcomes = [a, b].map((r) => ({
        ok: !r.error,
        insufficient: r.error?.message?.includes("insufficient_balance") ?? false,
      }));
      const successCount = outcomes.filter((o) => o.ok).length;
      assert.ok(successCount <= 1, "at most one concurrent debit of full balance may succeed");

      const { data: acct } = await admin
        .from("yike_coin_accounts")
        .select("balance_coins")
        .eq("user_id", userId)
        .single();
      assert.ok(Number(acct?.balance_coins ?? 0) >= 0);
    } finally {
      await deleteEphemeralUser(admin, userId);
    }
  }
);

test(
  "anon role cannot invoke yike_coin_debit RPC",
  { skip: integrationEnabled ? false : "dev integration not enabled" },
  async () => {
    const anon = anonClient()!;
    const userId = randomUUID();
    const { error } = await anon.rpc("yike_coin_debit", {
      p_user_id: userId,
      p_amount_coins: 1,
      p_reference: "DEV-EVIL",
      p_idempotency_key: `evil:${randomUUID()}`,
      p_service_code: "video_call_connected",
      p_reason: "should fail",
      p_metadata: {},
    });
    assert.ok(error, "expected permission denied for anon/authenticated debit RPC");
  }
);

test(
  "credit idempotency key mismatch is rejected",
  { skip: integrationEnabled ? false : "dev integration not enabled" },
  async () => {
    const admin = adminClient()!;
    const userId = await resolveEphemeralTestUserId(admin);
    try {
      const idempotencyKey = `dev-integration:credit:${randomUUID()}`;
      const reference = `DEV-CR-${randomUUID().slice(0, 8)}`;

      await admin.rpc("yike_ensure_coin_account", { p_user_id: userId });
      const first = await admin.rpc("yike_coin_credit", {
        p_user_id: userId,
        p_amount_coins: 3,
        p_reference: reference,
        p_idempotency_key: idempotencyKey,
        p_service_code: "wallet_topup",
        p_payment_order_id: null,
        p_reason: "dev integration test",
        p_metadata: {},
      });
      assert.ok(!first.error, first.error?.message);

      const mismatch = await admin.rpc("yike_coin_credit", {
        p_user_id: userId,
        p_amount_coins: 99,
        p_reference: reference,
        p_idempotency_key: idempotencyKey,
        p_service_code: "wallet_topup",
        p_payment_order_id: null,
        p_reason: "dev mismatch attempt",
        p_metadata: {},
      });
      assert.match(mismatch.error?.message ?? "", /idempotency_key_mismatch/);
    } finally {
      await deleteEphemeralUser(admin, userId);
    }
  }
);

test(
  "debit replay is idempotent and insufficient balance fails",
  { skip: integrationEnabled ? false : "dev integration not enabled" },
  async () => {
    const admin = adminClient()!;
    const userId = await resolveEphemeralTestUserId(admin);
    try {
      await admin.rpc("yike_ensure_coin_account", { p_user_id: userId });
      await admin.rpc("yike_coin_credit", {
        p_user_id: userId,
        p_amount_coins: 4,
        p_reference: `DEV-FUND-${randomUUID().slice(0, 8)}`,
        p_idempotency_key: `dev-integration:fund:${randomUUID()}`,
        p_service_code: "wallet_topup",
        p_payment_order_id: null,
        p_reason: "dev fund",
        p_metadata: {},
      });

      const idempotencyKey = `dev-integration:debit:${randomUUID()}`;
      const reference = `DEV-DB-${randomUUID().slice(0, 8)}`;
      const debitArgs = {
        p_user_id: userId,
        p_amount_coins: 4,
        p_reference: reference,
        p_idempotency_key: idempotencyKey,
        p_service_code: "video_call_connected",
        p_reason: "dev debit",
        p_metadata: {},
      };

      const first = await admin.rpc("yike_coin_debit", debitArgs);
      assert.ok(!first.error, first.error?.message);
      const replay = await admin.rpc("yike_coin_debit", debitArgs);
      assert.ok(!replay.error, replay.error?.message);
      const replayRow = Array.isArray(replay.data) ? replay.data[0] : replay.data;
      assert.equal(Boolean(replayRow?.already_applied), true);

      const broke = await admin.rpc("yike_coin_debit", {
        ...debitArgs,
        p_amount_coins: 1,
        p_reference: `DEV-DB-${randomUUID().slice(0, 8)}`,
        p_idempotency_key: `dev-integration:debit:${randomUUID()}`,
      });
      assert.match(broke.error?.message ?? "", /insufficient_balance/);
    } finally {
      await deleteEphemeralUser(admin, userId);
    }
  }
);

test(
  "reverse_debit restores balance once per reversal key",
  { skip: integrationEnabled ? false : "dev integration not enabled" },
  async () => {
    const admin = adminClient()!;
    const userId = await resolveEphemeralTestUserId(admin);
    try {
      await admin.rpc("yike_ensure_coin_account", { p_user_id: userId });
      await admin.rpc("yike_coin_credit", {
        p_user_id: userId,
        p_amount_coins: 7,
        p_reference: `DEV-FUND-${randomUUID().slice(0, 8)}`,
        p_idempotency_key: `dev-integration:fund:${randomUUID()}`,
        p_service_code: "wallet_topup",
        p_payment_order_id: null,
        p_reason: "fund before debit",
        p_metadata: {},
      });

      const debitKey = `dev-integration:debit:${randomUUID()}`;
      const reference = `DEV-DB-${randomUUID().slice(0, 8)}`;
      const debit = await admin.rpc("yike_coin_debit", {
        p_user_id: userId,
        p_amount_coins: 7,
        p_reference: reference,
        p_idempotency_key: debitKey,
        p_service_code: "video_call_connected",
        p_reason: "dev debit for reversal",
        p_metadata: {},
      });
      assert.ok(!debit.error, debit.error?.message);

      const reversalKey = `dev-integration:reversal:${randomUUID()}`;
      const rev1 = await admin.rpc("yike_coin_reverse_debit", {
        p_user_id: userId,
        p_original_idempotency_key: debitKey,
        p_reversal_idempotency_key: reversalKey,
        p_reason: "dev reversal",
      });
      assert.ok(!rev1.error, rev1.error?.message);
      const revRow1 = Array.isArray(rev1.data) ? rev1.data[0] : rev1.data;
      assert.equal(Boolean(revRow1?.already_applied), false);

      const rev2 = await admin.rpc("yike_coin_reverse_debit", {
        p_user_id: userId,
        p_original_idempotency_key: debitKey,
        p_reversal_idempotency_key: reversalKey,
        p_reason: "dev reversal replay",
      });
      assert.ok(!rev2.error, rev2.error?.message);
      const revRow2 = Array.isArray(rev2.data) ? rev2.data[0] : rev2.data;
      assert.equal(Boolean(revRow2?.already_applied), true);

      const { data: acct } = await admin
        .from("yike_coin_accounts")
        .select("balance_coins")
        .eq("user_id", userId)
        .single();
      assert.equal(Number(acct?.balance_coins ?? 0), 7);
    } finally {
      await deleteEphemeralUser(admin, userId);
    }
  }
);

test(
  "peer transfer moves YC atomically between ephemeral users",
  { skip: integrationEnabled ? false : "dev integration not enabled" },
  async () => {
    const admin = adminClient()!;
    if (!(await ycTransferRpcReady(admin))) {
      assert.fail("yike_coin_peer_transfer RPC missing — apply 20261026120000_yc_transfers_admin_grants.sql");
    }

    const senderId = await resolveEphemeralTestUserId(admin);
    const recipientId = await resolveEphemeralTestUserId(admin);
    const recipientUsername = `dev_${randomUUID().slice(0, 8)}`;
    try {
      await setTestUsername(admin, recipientId, recipientUsername);

      await admin.rpc("yike_ensure_coin_account", { p_user_id: senderId });
      const fund = await admin.rpc("yike_coin_credit", {
        p_user_id: senderId,
        p_amount_coins: 50,
        p_reference: `DEV-FUND-${randomUUID().slice(0, 8)}`,
        p_idempotency_key: `dev-integration:fund:${randomUUID()}`,
        p_service_code: "wallet_topup",
        p_payment_order_id: null,
        p_reason: "fund transfer test",
        p_metadata: {},
      });
      assert.ok(!fund.error, fund.error?.message);

      const idem = `dev-integration:atomic:${randomUUID()}`;
      const first = await admin.rpc("yike_coin_peer_transfer", {
        p_sender_id: senderId,
        p_recipient_username: recipientUsername,
        p_amount_coins: 12,
        p_idempotency_key: idem,
      });
      assert.ok(!first.error, first.error?.message);

      const replay = await admin.rpc("yike_coin_peer_transfer", {
        p_sender_id: senderId,
        p_recipient_username: recipientUsername,
        p_amount_coins: 12,
        p_idempotency_key: idem,
      });
      assert.ok(!replay.error, replay.error?.message);
      const replayRow = Array.isArray(replay.data) ? replay.data[0] : replay.data;
      assert.equal(Boolean(replayRow?.already_applied), true);

      const { data: recipientAcct } = await admin
        .from("yike_coin_accounts")
        .select("balance_coins")
        .eq("user_id", recipientId)
        .single();
      assert.equal(Number(recipientAcct?.balance_coins ?? 0), 12);

      const { data: senderAcct } = await admin
        .from("yike_coin_accounts")
        .select("balance_coins")
        .eq("user_id", senderId)
        .single();
      assert.equal(Number(senderAcct?.balance_coins ?? 0), 38);

      const { count: transferRows } = await admin
        .from("yike_coin_transfers")
        .select("id", { count: "exact", head: true })
        .eq("idempotency_key", idem);
      assert.equal(transferRows, 1);

      const transferRef = String(
        (Array.isArray(first.data) ? first.data[0] : first.data)?.transfer_reference ?? "",
      );
      assert.match(transferRef, /^TRF-/);

      const { data: ledgers } = await admin
        .from("yike_coin_ledger")
        .select("reference, direction, user_id")
        .in("reference", [transferRef, `${transferRef}-IN`]);
      assert.equal(ledgers?.length, 2, "debit and credit ledger rows must exist");
      const debitRow = ledgers?.find((r) => r.direction === "debit" && r.user_id === senderId);
      const creditRow = ledgers?.find(
        (r) => r.direction === "credit" && r.user_id === recipientId,
      );
      assert.equal(debitRow?.reference, transferRef);
      assert.equal(creditRow?.reference, `${transferRef}-IN`);
    } finally {
      await deleteEphemeralUser(admin, senderId);
      await deleteEphemeralUser(admin, recipientId);
    }
  }
);

test(
  "peer transfer idempotency mismatch rejects different recipient",
  { skip: integrationEnabled ? false : "dev integration not enabled" },
  async () => {
    const admin = adminClient()!;
    if (!(await ycTransferRpcReady(admin))) {
      assert.fail("yike_coin_peer_transfer RPC missing — apply migration");
    }
    const senderId = await resolveEphemeralTestUserId(admin);
    const recipientA = await resolveEphemeralTestUserId(admin);
    const recipientB = await resolveEphemeralTestUserId(admin);
    const userA = `ra_${randomUUID().slice(0, 8)}`;
    const userB = `rb_${randomUUID().slice(0, 8)}`;
    const idem = `dev-integration:recipient-mismatch:${randomUUID()}`;
    try {
      await setTestUsername(admin, recipientA, userA);
      await setTestUsername(admin, recipientB, userB);
      await admin.rpc("yike_coin_credit", {
        p_user_id: senderId,
        p_amount_coins: 30,
        p_reference: `DEV-FUND-${randomUUID().slice(0, 8)}`,
        p_idempotency_key: `dev-integration:fund:${randomUUID()}`,
        p_service_code: "wallet_topup",
        p_payment_order_id: null,
        p_reason: "fund",
        p_metadata: {},
      });
      await admin.rpc("yike_coin_peer_transfer", {
        p_sender_id: senderId,
        p_recipient_username: userA,
        p_amount_coins: 4,
        p_idempotency_key: idem,
      });
      const mismatch = await admin.rpc("yike_coin_peer_transfer", {
        p_sender_id: senderId,
        p_recipient_username: userB,
        p_amount_coins: 4,
        p_idempotency_key: idem,
      });
      assert.match(mismatch.error?.message ?? "", /idempotency_key_mismatch/);
    } finally {
      await deleteEphemeralUser(admin, senderId);
      await deleteEphemeralUser(admin, recipientA);
      await deleteEphemeralUser(admin, recipientB);
    }
  }
);

test(
  "peer transfer rejects self-transfer and insufficient balance",
  { skip: integrationEnabled ? false : "dev integration not enabled" },
  async () => {
    const admin = adminClient()!;
    if (!(await ycTransferRpcReady(admin))) {
      assert.fail("yike_coin_peer_transfer RPC missing — apply migration");
    }
    const userId = await resolveEphemeralTestUserId(admin);
    const uname = `self_${randomUUID().slice(0, 8)}`;
    try {
      await setTestUsername(admin, userId, uname);
      const self = await admin.rpc("yike_coin_peer_transfer", {
        p_sender_id: userId,
        p_recipient_username: uname,
        p_amount_coins: 1,
        p_idempotency_key: `dev-integration:self:${randomUUID()}`,
      });
      assert.match(self.error?.message ?? "", /self_transfer/);

      await admin.rpc("yike_coin_credit", {
        p_user_id: userId,
        p_amount_coins: 2,
        p_reference: `DEV-FUND-${randomUUID().slice(0, 8)}`,
        p_idempotency_key: `dev-integration:fund:${randomUUID()}`,
        p_service_code: "wallet_topup",
        p_payment_order_id: null,
        p_reason: "fund",
        p_metadata: {},
      });

      const recipientId = await resolveEphemeralTestUserId(admin);
      const recipientUsername = `peer_${randomUUID().slice(0, 8)}`;
      await setTestUsername(admin, recipientId, recipientUsername);

      const broke = await admin.rpc("yike_coin_peer_transfer", {
        p_sender_id: userId,
        p_recipient_username: recipientUsername,
        p_amount_coins: 50,
        p_idempotency_key: `dev-integration:transfer:${randomUUID()}`,
      });
      assert.match(broke.error?.message ?? "", /insufficient_balance/);

      await deleteEphemeralUser(admin, recipientId);
    } finally {
      await deleteEphemeralUser(admin, userId);
    }
  }
);

test(
  "peer transfer idempotency mismatch rejects different amount",
  { skip: integrationEnabled ? false : "dev integration not enabled" },
  async () => {
    const admin = adminClient()!;
    if (!(await ycTransferRpcReady(admin))) {
      assert.fail("yike_coin_peer_transfer RPC missing — apply migration");
    }
    const senderId = await resolveEphemeralTestUserId(admin);
    const recipientId = await resolveEphemeralTestUserId(admin);
    const recipientUsername = `mm_${randomUUID().slice(0, 8)}`;
    const idem = `dev-integration:transfer:${randomUUID()}`;
    try {
      await setTestUsername(admin, recipientId, recipientUsername);
      await admin.rpc("yike_coin_credit", {
        p_user_id: senderId,
        p_amount_coins: 20,
        p_reference: `DEV-FUND-${randomUUID().slice(0, 8)}`,
        p_idempotency_key: `dev-integration:fund:${randomUUID()}`,
        p_service_code: "wallet_topup",
        p_payment_order_id: null,
        p_reason: "fund",
        p_metadata: {},
      });
      await admin.rpc("yike_coin_peer_transfer", {
        p_sender_id: senderId,
        p_recipient_username: recipientUsername,
        p_amount_coins: 5,
        p_idempotency_key: idem,
      });
      const mismatch = await admin.rpc("yike_coin_peer_transfer", {
        p_sender_id: senderId,
        p_recipient_username: recipientUsername,
        p_amount_coins: 6,
        p_idempotency_key: idem,
      });
      assert.match(mismatch.error?.message ?? "", /idempotency_key_mismatch/);
    } finally {
      await deleteEphemeralUser(admin, senderId);
      await deleteEphemeralUser(admin, recipientId);
    }
  }
);

test(
  "concurrent peer transfers cannot double-spend sender balance",
  { skip: integrationEnabled ? false : "dev integration not enabled" },
  async () => {
    const admin = adminClient()!;
    if (!(await ycTransferRpcReady(admin))) {
      assert.fail("yike_coin_peer_transfer RPC missing — apply migration");
    }
    const senderId = await resolveEphemeralTestUserId(admin);
    const recipientA = await resolveEphemeralTestUserId(admin);
    const recipientB = await resolveEphemeralTestUserId(admin);
    const userA = `ca_${randomUUID().slice(0, 8)}`;
    const userB = `cb_${randomUUID().slice(0, 8)}`;
    try {
      await setTestUsername(admin, recipientA, userA);
      await setTestUsername(admin, recipientB, userB);
      await admin.rpc("yike_coin_credit", {
        p_user_id: senderId,
        p_amount_coins: 10,
        p_reference: `DEV-FUND-${randomUUID().slice(0, 8)}`,
        p_idempotency_key: `dev-integration:fund:${randomUUID()}`,
        p_service_code: "wallet_topup",
        p_payment_order_id: null,
        p_reason: "fund",
        p_metadata: {},
      });

      const [t1, t2] = await Promise.all([
        admin.rpc("yike_coin_peer_transfer", {
          p_sender_id: senderId,
          p_recipient_username: userA,
          p_amount_coins: 10,
          p_idempotency_key: `dev-integration:transfer:${randomUUID()}`,
        }),
        admin.rpc("yike_coin_peer_transfer", {
          p_sender_id: senderId,
          p_recipient_username: userB,
          p_amount_coins: 10,
          p_idempotency_key: `dev-integration:transfer:${randomUUID()}`,
        }),
      ]);

      const okCount = [t1, t2].filter((r) => !r.error).length;
      assert.ok(okCount <= 1, "only one concurrent full-balance transfer may succeed");

      const { data: senderAcct } = await admin
        .from("yike_coin_accounts")
        .select("balance_coins")
        .eq("user_id", senderId)
        .single();
      assert.ok(Number(senderAcct?.balance_coins ?? 0) >= 0);
    } finally {
      await deleteEphemeralUser(admin, senderId);
      await deleteEphemeralUser(admin, recipientA);
      await deleteEphemeralUser(admin, recipientB);
    }
  }
);

test(
  "admin grant credits once with audit row and idempotent replay",
  { skip: integrationEnabled ? false : "dev integration not enabled" },
  async () => {
    const admin = adminClient()!;
    if (!(await ycAdminGrantRpcReady(admin))) {
      assert.fail("yike_coin_admin_grant RPC missing — apply migration");
    }
    const actorId = await resolveEphemeralTestUserId(admin);
    const recipientId = await resolveEphemeralTestUserId(admin);
    const idem = `dev-integration:grant:${randomUUID()}`;
    const ref = `GRT-${randomUUID().slice(0, 8)}`;
    try {
      const first = await admin.rpc("yike_coin_admin_grant", {
        p_actor_id: actorId,
        p_recipient_id: recipientId,
        p_amount_coins: 15,
        p_reason: "dev integration grant",
        p_idempotency_key: idem,
        p_grant_reference: ref,
      });
      assert.ok(!first.error, first.error?.message);

      const replay = await admin.rpc("yike_coin_admin_grant", {
        p_actor_id: actorId,
        p_recipient_id: recipientId,
        p_amount_coins: 15,
        p_reason: "dev integration grant",
        p_idempotency_key: idem,
        p_grant_reference: ref,
      });
      assert.ok(!replay.error, replay.error?.message);
      const replayRow = Array.isArray(replay.data) ? replay.data[0] : replay.data;
      assert.equal(Boolean(replayRow?.already_applied), true);

      const { count } = await admin
        .from("yike_coin_admin_grants")
        .select("id", { count: "exact", head: true })
        .eq("idempotency_key", idem);
      assert.equal(count, 1);

      const { data: acct } = await admin
        .from("yike_coin_accounts")
        .select("balance_coins")
        .eq("user_id", recipientId)
        .single();
      assert.equal(Number(acct?.balance_coins ?? 0), 15);
    } finally {
      await deleteEphemeralUser(admin, actorId);
      await deleteEphemeralUser(admin, recipientId);
    }
  }
);

test(
  "video free allowance concurrent consume respects limit",
  { skip: integrationEnabled ? false : "dev integration not enabled" },
  async () => {
    const admin = adminClient()!;
    const userId = await resolveEphemeralTestUserId(admin);
    const peerId = await resolveEphemeralTestUserId(admin);
    try {
      const usageDate = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Africa/Lagos",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());

      await admin.from("video_call_daily_usage").delete().eq("user_id", userId);

      const sessionIds = Array.from({ length: 5 }, () => randomUUID());
      for (const sessionId of sessionIds) {
        await admin.from("video_call_sessions").insert({
          id: sessionId,
          caller_id: userId,
          callee_id: peerId,
          call_type: "video",
          status: "ringing",
        });
      }
      const calls = await Promise.all(
        sessionIds.map((sessionId) =>
          admin.rpc("yike_video_try_consume_free_allowance", {
            p_user_id: userId,
            p_session_id: sessionId,
            p_usage_date: usageDate,
            p_free_limit: 3,
          })
        )
      );

      const consumed = calls.filter((c) => {
        const row = Array.isArray(c.data) ? c.data[0] : c.data;
        return Boolean(row?.consumed);
      }).length;
      assert.equal(consumed, 3, "exactly three free slots under concurrent load");

    } finally {
      await deleteEphemeralUser(admin, userId);
      await deleteEphemeralUser(admin, peerId);
    }
  }
);
