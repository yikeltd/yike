import { createAdminClient } from "@/lib/supabase/admin";
import { isFeatureEnabled } from "@/lib/feature-flags/index";
import { purchaseWithYikeCoins } from "@/lib/yike-coins/purchase-engine";
import { resolveActiveServicePrice } from "@/lib/yike-coins/pricing";
import {
  getVideoCallPreflight,
  releaseFreeVideoAllowance,
  tryConsumeFreeVideoAllowance,
} from "./allowance";
import { createCallProviderSession } from "./provider";
import { reverseYikeCoinDebit } from "@/lib/yike-coins/reversal";

const OPEN_CALL_STATUSES = new Set(["ringing", "connected"]);
const TERMINAL_CALL_STATUSES = new Set(["failed", "declined", "missed", "cancelled", "ended"]);
/** Release free slot when call had connected on free allowance but did not end normally. */
const RELEASE_FREE_ON_TERMINAL = new Set(["failed", "declined", "missed", "cancelled"]);

export type VideoCallTerminalStatus = "failed" | "declined" | "missed" | "cancelled" | "ended";

export type StartCallInput = {
  callerId: string;
  calleeId: string;
  listingId?: string | null;
  conversationId?: string | null;
  callType: "voice" | "video";
  idempotencyKey: string;
};

async function finalizeProviderForSession(
  sessionId: string,
  callerId: string,
  calleeId: string,
  callType: "voice" | "video"
) {
  const admin = createAdminClient();
  const provider = await createCallProviderSession({
    sessionId,
    callerId,
    calleeId,
    callType,
    participantUserId: callerId,
  });

  if (admin) {
    await admin
      .from("video_call_sessions")
      .update({
        provider: provider.providerId,
        provider_session_id: provider.channelName,
      })
      .eq("id", sessionId);
  }

  return provider;
}

type ConnectionBillingResult = {
  billingStatus: "free_allowance" | "coin_debit" | "none";
  coinLedgerId: string | null;
  freeAllowanceCommitted: boolean;
  coinDebitIdempotencyKey: string | null;
  callerId: string;
};

async function undoConnectionBilling(billing: ConnectionBillingResult, sessionId: string) {
  if (billing.freeAllowanceCommitted) {
    await releaseFreeVideoAllowance(sessionId);
  }
  if (billing.billingStatus === "coin_debit" && billing.coinDebitIdempotencyKey) {
    await reverseYikeCoinDebit({
      userId: billing.callerId,
      originalIdempotencyKey: billing.coinDebitIdempotencyKey,
      reversalIdempotencyKey: `${billing.coinDebitIdempotencyKey}:reversal`,
      reason: "Video call connection billing rollback",
    });
  }
}

async function rollbackFailedConnection(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  sessionId: string,
  billing?: ConnectionBillingResult
) {
  if (billing) {
    await undoConnectionBilling(billing, sessionId);
  } else {
    await releaseFreeVideoAllowance(sessionId);
  }

  await admin
    .from("video_call_sessions")
    .update({
      status: "failed",
      billing_status: "failed",
      ended_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("status", "connected");
}

/**
 * Bill only after winning the ringing → connected race (prevents double free-slot / double debit).
 */
async function applyVideoCallConnectionBilling(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  sessionId: string,
  callerId: string,
  callType: "voice" | "video",
  existingLedgerId: string | null
): Promise<
  | { ok: true; billing: ConnectionBillingResult }
  | { ok: false; error: string; code: string; billing?: ConnectionBillingResult }
> {
  const coinDebitIdempotencyKey = `video_call:${sessionId}:debit`;
  const emptyBilling: ConnectionBillingResult = {
    billingStatus: "none",
    coinLedgerId: existingLedgerId,
    freeAllowanceCommitted: false,
    coinDebitIdempotencyKey: null,
    callerId,
  };

  if (callType !== "video" || existingLedgerId) {
    return { ok: true, billing: { ...emptyBilling, coinLedgerId: existingLedgerId } };
  }

  const preflight = await getVideoCallPreflight(callerId);
  if (!preflight.billable) {
    const free = await tryConsumeFreeVideoAllowance(callerId, sessionId);
    if (free.consumed) {
      return {
        ok: true,
        billing: {
          billingStatus: "free_allowance",
          coinLedgerId: null,
          freeAllowanceCommitted: true,
          coinDebitIdempotencyKey: null,
          callerId,
        },
      };
    }
  }

  const price = await resolveActiveServicePrice(admin, "video_call_connected");
  if (!price.ok) {
    return {
      ok: false,
      error: price.error,
      code: price.code === "inactive" ? "feature_inactive" : "price_not_configured",
    };
  }

  if (preflight.balanceCoins < price.priceCoins) {
    return { ok: false, error: "Insufficient Yike Coins", code: "insufficient_balance" };
  }

  const purchase = await purchaseWithYikeCoins(admin, {
    userId: callerId,
    serviceCode: "video_call_connected",
    idempotencyKey: coinDebitIdempotencyKey,
    reference: `VC-${sessionId.slice(0, 8)}`,
    priceCoins: price.priceCoins,
    entityType: "video_call_session",
    entityId: sessionId,
    metadata: { session_id: sessionId },
  });

  if (!purchase.ok) {
    return { ok: false, error: purchase.error, code: purchase.code };
  }

  return {
    ok: true,
    billing: {
      billingStatus: "coin_debit",
      coinLedgerId: purchase.ledgerId,
      freeAllowanceCommitted: false,
      coinDebitIdempotencyKey,
      callerId,
    },
  };
}

/** Terminal call states — release free allowance when the session never qualified as a kept connection. */
export async function finalizeMarketplaceCallSession(
  sessionId: string,
  actorId: string,
  terminalStatus: VideoCallTerminalStatus
) {
  const admin = createAdminClient();
  if (!admin) {
    return { ok: false as const, error: "Database unavailable", code: "unavailable" };
  }

  const { data: session } = await admin
    .from("video_call_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) {
    return { ok: false as const, error: "Call not found", code: "not_found" };
  }

  if (session.caller_id !== actorId && session.callee_id !== actorId) {
    return { ok: false as const, error: "Forbidden", code: "forbidden" };
  }

  const priorStatus = session.status as string;
  if (TERMINAL_CALL_STATUSES.has(priorStatus)) {
    if (priorStatus === terminalStatus) {
      return { ok: true as const, session, reused: true };
    }
    return {
      ok: false as const,
      error: "Call already finalized",
      code: "already_finalized",
    };
  }

  if (!OPEN_CALL_STATUSES.has(priorStatus)) {
    return { ok: false as const, error: "Call is not active", code: "invalid_state" };
  }

  const wasConnected = priorStatus === "connected";
  const billingStatus = session.billing_status as string;
  const now = new Date().toISOString();

  const { data: updated, error: updateErr } = await admin
    .from("video_call_sessions")
    .update({
      status: terminalStatus,
      ended_at: now,
    })
    .eq("id", sessionId)
    .in("status", ["ringing", "connected"])
    .select("*")
    .maybeSingle();

  if (updateErr || !updated) {
    const { data: again } = await admin
      .from("video_call_sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();
    if (again?.status === terminalStatus) {
      return { ok: true as const, session: again, reused: true };
    }
    if (again && TERMINAL_CALL_STATUSES.has(again.status as string)) {
      return {
        ok: false as const,
        error: "Call already finalized",
        code: "already_finalized",
      };
    }
    return { ok: false as const, error: "Could not finalize call", code: "finalize_race" };
  }

  if (
    wasConnected &&
    billingStatus === "free_allowance" &&
    RELEASE_FREE_ON_TERMINAL.has(terminalStatus)
  ) {
    await releaseFreeVideoAllowance(sessionId);
  }

  return { ok: true as const, session: updated, reused: false };
}

export async function startMarketplaceCall(input: StartCallInput) {
  if (input.callType === "video" && !isFeatureEnabled("video_call_beta")) {
    return { ok: false as const, error: "Video calls are not available", code: "disabled" };
  }
  if (input.callType === "voice" && !isFeatureEnabled("voice_call_beta")) {
    return { ok: false as const, error: "Voice calls are not available", code: "disabled" };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { ok: false as const, error: "Database unavailable", code: "unavailable" };
  }

  const { data: existing } = await admin
    .from("video_call_sessions")
    .select("*")
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle();

  if (existing) {
    return { ok: true as const, session: existing, reused: true };
  }

  const { data: session, error } = await admin
    .from("video_call_sessions")
    .insert({
      caller_id: input.callerId,
      callee_id: input.calleeId,
      listing_id: input.listingId ?? null,
      conversation_id: input.conversationId ?? null,
      call_type: input.callType,
      status: "ringing",
      idempotency_key: input.idempotencyKey,
    })
    .select("*")
    .single();

  if (error || !session) {
    return { ok: false as const, error: error?.message ?? "Could not start call", code: "create_failed" };
  }

  return { ok: true as const, session, reused: false };
}

export async function markCallConnected(sessionId: string, callerId: string) {
  const admin = createAdminClient();
  if (!admin) {
    return { ok: false as const, error: "Database unavailable", code: "unavailable" };
  }

  const { data: session } = await admin
    .from("video_call_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session || session.caller_id !== callerId) {
    return { ok: false as const, error: "Forbidden", code: "forbidden" };
  }

  if (session.status === "connected") {
    const provider = await finalizeProviderForSession(
      sessionId,
      callerId,
      session.callee_id as string,
      session.call_type as "voice" | "video"
    );
    return {
      ok: true as const,
      session,
      billingStatus: session.billing_status,
      provider,
      reused: true,
    };
  }

  if (session.status !== "ringing") {
    return { ok: false as const, error: "Call is not ringing", code: "invalid_state" };
  }

  if (session.call_type === "video" && !session.coin_ledger_id) {
    const preflight = await getVideoCallPreflight(callerId);
    if (preflight.billable) {
      const price = await resolveActiveServicePrice(admin, "video_call_connected");
      if (!price.ok) {
        return {
          ok: false as const,
          error: "Video call pricing is not configured",
          code: "price_not_configured",
        };
      }
      if (preflight.balanceCoins < price.priceCoins) {
        return { ok: false as const, error: "Insufficient Yike Coins", code: "insufficient_balance" };
      }
    }
  }

  const now = new Date().toISOString();
  const { data: claimed, error: claimErr } = await admin
    .from("video_call_sessions")
    .update({
      status: "connected",
      connected_at: now,
    })
    .eq("id", sessionId)
    .eq("status", "ringing")
    .select("*")
    .maybeSingle();

  if (claimErr || !claimed) {
    const { data: again } = await admin
      .from("video_call_sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();
    if (again?.status === "connected") {
      const provider = await finalizeProviderForSession(
        sessionId,
        callerId,
        again.callee_id as string,
        again.call_type as "voice" | "video"
      );
      return {
        ok: true as const,
        session: again,
        billingStatus: again.billing_status,
        provider,
        reused: true,
      };
    }
    return { ok: false as const, error: "Could not connect call", code: "connect_race" };
  }

  const billingResult = await applyVideoCallConnectionBilling(
    admin,
    sessionId,
    callerId,
    claimed.call_type as "voice" | "video",
    (claimed.coin_ledger_id as string | null) ?? null
  );

  if (!billingResult.ok) {
    await rollbackFailedConnection(admin, sessionId, billingResult.billing);
    return { ok: false as const, error: billingResult.error, code: billingResult.code };
  }

  const billing = billingResult.billing;
  const { data: updated, error: billingPersistErr } = await admin
    .from("video_call_sessions")
    .update({
      billing_status: billing.billingStatus,
      coin_ledger_id: billing.coinLedgerId,
    })
    .eq("id", sessionId)
    .eq("status", "connected")
    .select("*")
    .maybeSingle();

  if (billingPersistErr || !updated) {
    await rollbackFailedConnection(admin, sessionId, billing);
    return {
      ok: false as const,
      error: "Could not persist call billing",
      code: "billing_persist_failed",
    };
  }

  const sessionRow = updated;
  const provider = await finalizeProviderForSession(
    sessionId,
    callerId,
    sessionRow.callee_id as string,
    sessionRow.call_type as "voice" | "video"
  );

  return {
    ok: true as const,
    session: sessionRow,
    billingStatus: billing.billingStatus,
    provider,
    reused: false,
  };
}
