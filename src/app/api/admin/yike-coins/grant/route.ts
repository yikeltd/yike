import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdminApi } from "@/lib/admin/api-auth";
import { writeAuditLogAsync } from "@/lib/admin/audit";
import { executeAdminYcGrant } from "@/lib/yike-coins/transfer";
import { ADMIN_GRANT_MAX_COINS } from "@/lib/yike-coins/rate-limit";
import { resolveUserIdByUsername } from "@/lib/username/lookup";
import { validateUsername } from "@/lib/username/rules";
import { isYikeCoinsEnabled } from "@/lib/yike-coins/flags";

export const runtime = "nodejs";

type GrantBody = {
  recipientUsername?: string;
  userId?: string;
  amountCoins?: number;
  reason?: string;
  reference?: string;
};

export async function POST(request: Request) {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isYikeCoinsEnabled()) {
    return NextResponse.json({ error: "YC is not enabled" }, { status: 503 });
  }

  const idempotencyKey =
    request.headers.get("idempotency-key")?.trim() ||
    request.headers.get("x-idempotency-key")?.trim();

  let body: GrantBody = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const reason = body.reason?.trim() ?? "";
  const amountCoins = body.amountCoins;
  const reference = body.reference?.trim() || `GRT-${randomUUID().slice(0, 8).toUpperCase()}`;
  const idem = idempotencyKey || `admin_grant:${reference}`;

  if (!Number.isInteger(amountCoins) || (amountCoins ?? 0) <= 0) {
    return NextResponse.json({ error: "amountCoins must be a positive integer" }, { status: 400 });
  }
  if ((amountCoins ?? 0) > ADMIN_GRANT_MAX_COINS) {
    return NextResponse.json(
      { error: `Grant exceeds configured maximum (${ADMIN_GRANT_MAX_COINS} YC)` },
      { status: 400 }
    );
  }
  if (reason.length < 3) {
    return NextResponse.json({ error: "Purpose/reason is required (min 3 characters)" }, { status: 400 });
  }

  let recipientId = body.userId?.trim() ?? null;
  if (!recipientId && body.recipientUsername) {
    const validated = validateUsername(body.recipientUsername);
    if (!validated.ok) {
      return NextResponse.json({ error: "Invalid recipient username" }, { status: 400 });
    }
    recipientId = await resolveUserIdByUsername(validated.username);
  }

  if (!recipientId) {
    return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const grantReference = `ADM-${reference}`;
  const result = await executeAdminYcGrant(admin, {
    actorId: auth.user.id,
    recipientId,
    amountCoins: amountCoins!,
    reason,
    idempotencyKey: idem,
    grantReference,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error, code: result.code }, { status: 400 });
  }

  void writeAuditLogAsync({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "yike_coin_admin_grant",
    target_type: "profile",
    target_id: recipientId,
    metadata: {
      amount_coins: amountCoins,
      reason,
      grant_reference: grantReference,
      ledger_id: result.ledgerId,
      grant_id: result.grantId,
      already_applied: result.alreadyApplied,
    },
  });

  return NextResponse.json({
    grantId: result.grantId,
    ledgerId: result.ledgerId,
    balanceAfter: result.balanceAfter,
    grantReference,
    alreadyApplied: result.alreadyApplied,
  });
}

export async function GET(request: Request) {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 30), 1), 100);

  const { data, error } = await admin
    .from("yike_coin_admin_grants")
    .select(
      "id, grant_reference, amount_coins, reason, created_at, actor_id, recipient_id, ledger_id"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ grants: data ?? [] });
}
