import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { isYikeCoinsEnabled } from "./flags";

export type PeerTransferResult =
  | {
      ok: true;
      transferId: string;
      transferReference: string;
      balanceAfter: number;
      alreadyApplied: boolean;
    }
  | { ok: false; error: string; code: string };

function mapTransferRpcError(message: string | undefined): { error: string; code: string } {
  const msg = message ?? "Transfer failed";
  if (msg.includes("recipient_not_found")) {
    return { error: "No user found with that username", code: "recipient_not_found" };
  }
  if (msg.includes("self_transfer")) {
    return { error: "You cannot send YC to yourself", code: "self_transfer" };
  }
  if (msg.includes("insufficient_balance")) {
    return { error: "Insufficient YC balance", code: "insufficient_balance" };
  }
  if (msg.includes("idempotency_key_mismatch")) {
    return { error: "Duplicate request with different details", code: "idempotency_mismatch" };
  }
  if (msg.includes("invalid_amount")) {
    return { error: "Invalid amount", code: "invalid_amount" };
  }
  return { error: "Transfer could not be completed", code: "transfer_failed" };
}

export async function executePeerYcTransfer(input: {
  senderId: string;
  recipientUsername: string;
  amountCoins: number;
  idempotencyKey: string;
  note?: string | null;
}): Promise<PeerTransferResult> {
  if (!isYikeCoinsEnabled()) {
    return { ok: false, error: "YC wallet is not available", code: "disabled" };
  }
  if (!Number.isInteger(input.amountCoins) || input.amountCoins <= 0) {
    return { ok: false, error: "Enter a whole number of YC", code: "invalid_amount" };
  }
  if (!input.idempotencyKey.trim()) {
    return { ok: false, error: "Missing idempotency key", code: "invalid_input" };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { ok: false, error: "Database unavailable", code: "unavailable" };
  }

  const { data, error } = await admin.rpc("yike_coin_peer_transfer", {
    p_sender_id: input.senderId,
    p_recipient_username: input.recipientUsername.trim(),
    p_amount_coins: input.amountCoins,
    p_idempotency_key: input.idempotencyKey.trim(),
    p_note: input.note?.trim() || null,
  });

  if (error) {
    const mapped = mapTransferRpcError(error.message);
    return { ok: false, ...mapped };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    ok: true,
    transferId: String(row?.transfer_id ?? ""),
    transferReference: String(row?.transfer_reference ?? ""),
    balanceAfter: Number(row?.sender_balance_after ?? 0),
    alreadyApplied: Boolean(row?.already_applied),
  };
}

export async function executeAdminYcGrant(
  admin: SupabaseClient,
  input: {
    actorId: string;
    recipientId: string;
    amountCoins: number;
    reason: string;
    idempotencyKey: string;
    grantReference: string;
  }
): Promise<
  | { ok: true; grantId: string; ledgerId: string; balanceAfter: number; alreadyApplied: boolean }
  | { ok: false; error: string; code: string }
> {
  if (!Number.isInteger(input.amountCoins) || input.amountCoins <= 0) {
    return { ok: false, error: "Invalid amount", code: "invalid_amount" };
  }
  const reason = input.reason.trim();
  if (reason.length < 3) {
    return { ok: false, error: "Purpose is required (min 3 characters)", code: "invalid_reason" };
  }

  const { data, error } = await admin.rpc("yike_coin_admin_grant", {
    p_actor_id: input.actorId,
    p_recipient_id: input.recipientId,
    p_amount_coins: input.amountCoins,
    p_reason: reason,
    p_idempotency_key: input.idempotencyKey.trim(),
    p_grant_reference: input.grantReference.trim(),
  });

  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("idempotency_key_mismatch")) {
      return { ok: false, error: "Duplicate grant with different details", code: "idempotency_mismatch" };
    }
    return { ok: false, error: "Grant failed", code: "grant_failed" };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    ok: true,
    grantId: String(row?.grant_id ?? ""),
    ledgerId: String(row?.ledger_id ?? ""),
    balanceAfter: Number(row?.balance_after ?? 0),
    alreadyApplied: Boolean(row?.already_applied),
  };
}
